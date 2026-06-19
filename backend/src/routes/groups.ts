import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { name, icon } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Group name is required' });
    }

    const group = await prisma.group.create({
      data: {
        name,
        icon: icon || '👥',
        createdBy: userId,
        members: {
          create: {
            userId,
            role: 'admin',
          },
        },
      },
      include: {
        creator: true,
        members: {
          include: { user: true },
        },
      },
    });

    res.status(201).json(group);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const groups = await prisma.group.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        creator: true,
        members: {
          include: { user: true },
        },
        expenses: {
          include: {
            splits: true,
          },
        },
      },
    });

    res.json(groups);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    if (typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid group ID' });
    }

    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        creator: true,
        members: {
          include: { user: true },
        },
        expenses: {
          include: {
            expense: true,
          },
        },
      },
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const isMember = group.members.some((m) => m.userId === userId);
    if (!isMember) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }

    res.json(group);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch group' });
  }
});

router.post('/:id/members', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const { userId: newMemberId } = req.body;

    if (!newMemberId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    if (typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid group ID' });
    }

    const group = await prisma.group.findUnique({
      where: { id },
      include: { members: true },
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const isAdmin = group.members.some(
      (m) => m.userId === userId && m.role === 'admin'
    );
    if (!isAdmin) {
      return res.status(403).json({ error: 'Only admins can add members' });
    }

    const alreadyMember = group.members.some((m) => m.userId === newMemberId);
    if (alreadyMember) {
      return res.status(400).json({ error: 'User is already a member' });
    }

    const member = await prisma.groupMember.create({
      data: {
        groupId: id,
        userId: newMemberId,
        role: 'member',
      },
      include: { user: true },
    });

    res.status(201).json(member);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add member' });
  }
});

router.delete('/:id/members/:memberId', async (req: AuthRequest, res: Response) => {
  try {
    const { id, memberId } = req.params;
    const userId = req.userId!;

    if (typeof id !== 'string' || typeof memberId !== 'string') {
      return res.status(400).json({ error: 'Invalid IDs' });
    }

    const group = await prisma.group.findUnique({
      where: { id },
      include: { members: true },
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const isAdmin = group.members.some(
      (m) => m.userId === userId && m.role === 'admin'
    );
    const isSelf = userId === memberId;

    if (!isAdmin && !isSelf) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const member = await prisma.groupMember.findFirst({
      where: {
        groupId: id,
        userId: memberId,
      },
    });

    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    if (member.role === 'admin') {
      const adminCount = group.members.filter(m => m.role === 'admin').length;
      
      if (adminCount === 1) {
        // Find the oldest non-admin member
        const nextAdmin = group.members
          .filter(m => m.role === 'member')
          .sort((a, b) => a.id.localeCompare(b.id))[0];
        
        if (nextAdmin) {
          // Promote them to admin
          await prisma.groupMember.update({
            where: { id: nextAdmin.id },
            data: { role: 'admin' },
          });
        }
      }
    }

    await prisma.groupMember.delete({
      where: { id: member.id },
    });

    res.json({ message: 'Member removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const { name, icon } = req.body;

    if (typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid group ID' });
    }

    const group = await prisma.group.findUnique({
      where: { id },
      include: { members: true },
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const isAdmin = group.members.some(
      (m) => m.userId === userId && m.role === 'admin'
    );
    if (!isAdmin) {
      return res.status(403).json({ error: 'Only admins can update group' });
    }

    const updated = await prisma.group.update({
      where: { id },
      data: { name, icon },
      include: {
        creator: true,
        members: { include: { user: true } },
        expenses: true,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update group' });
  }
});

router.post('/:id/promote-admin', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const { memberId } = req.body;

    if (typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid group ID' });
    }

    if (!memberId) {
      return res.status(400).json({ error: 'memberId is required' });
    }

    const group = await prisma.group.findUnique({
      where: { id },
      include: { members: true },
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const isAdmin = group.members.some(
      (m) => m.userId === userId && m.role === 'admin'
    );
    if (!isAdmin) {
      return res.status(403).json({ error: 'Only admins can promote members' });
    }

    const memberToPromote = group.members.find((m) => m.userId === memberId);
    if (!memberToPromote) {
      return res.status(404).json({ error: 'Member not found' });
    }

    if (memberToPromote.role === 'admin') {
      return res.status(400).json({ error: 'User is already an admin' });
    }

    const promoted = await prisma.groupMember.update({
      where: { id: memberToPromote.id },
      data: { role: 'admin' },
      include: { user: true },
    });

    res.json({
      message: `${promoted.user.name} is now an admin`,
      member: promoted,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to promote member' });
  }
});

router.post('/:id/demote-admin', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const { memberId } = req.body;

    if (typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid group ID' });
    }

    if (!memberId) {
      return res.status(400).json({ error: 'memberId is required' });
    }

    if (userId === memberId) {
      return res.status(400).json({ error: 'You cannot demote yourself' });
    }

    const group = await prisma.group.findUnique({
      where: { id },
      include: { members: true },
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const isAdmin = group.members.some(
      (m) => m.userId === userId && m.role === 'admin'
    );
    if (!isAdmin) {
      return res.status(403).json({ error: 'Only admins can demote members' });
    }

    const adminCount = group.members.filter((m) => m.role === 'admin').length;
    if (adminCount === 1) {
      return res.status(400).json({
        error: 'Cannot demote the only admin. Promote another member first.',
      });
    }

    const memberToDemote = group.members.find((m) => m.userId === memberId);
    if (!memberToDemote) {
      return res.status(404).json({ error: 'Member not found' });
    }

    if (memberToDemote.role !== 'admin') {
      return res.status(400).json({ error: 'User is not an admin' });
    }

    const demoted = await prisma.groupMember.update({
      where: { id: memberToDemote.id },
      data: { role: 'member' },
      include: { user: true },
    });

    res.json({
      message: `${demoted.user.name} is no longer an admin`,
      member: demoted,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to demote member' });
  }
});

// DELETE GROUP (Admins only)
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    if (typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid group ID' });
    }

    const group = await prisma.group.findUnique({
      where: { id },
      include: { members: true },
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const isAdmin = group.members.some(
      (m) => m.userId === userId && m.role === 'admin'
    );
    if (!isAdmin) {
      return res.status(403).json({ error: 'Only admins can delete this group' });
    }

    // Delete splits first since they cascade on group expense, but let's make sure
    const groupExpenses = await prisma.groupExpense.findMany({
      where: { groupId: id }
    });

    for (const ge of groupExpenses) {
      await prisma.split.deleteMany({
        where: { groupExpenseId: ge.id }
      });
      await prisma.groupExpense.delete({
        where: { id: ge.id }
      });
      await prisma.expense.delete({
        where: { id: ge.expenseId }
      });
    }

    await prisma.group.delete({
      where: { id },
    });

    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(500).json({ error: 'Failed to delete group' });
  }
});

export default router;