import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

// ===== CREATE GROUP EXPENSE (Equal or Custom Split) =====
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { groupId, amount, currency, categoryId, description, merchant, splitType, customSplits, paidByUserId, date } = req.body;

    // Validate input
    if (!groupId || !amount || !categoryId) {
      return res.status(400).json({ error: 'groupId, amount, and categoryId are required' });
    }

    if (!splitType || (splitType !== 'equal' && splitType !== 'custom')) {
      return res.status(400).json({ error: 'splitType must be "equal" or "custom"' });
    }

    if (splitType === 'custom' && !customSplits) {
      return res.status(400).json({ error: 'customSplits required for custom split' });
    }

    // Check if group exists
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { members: true },
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if logged in user is a member
    const isMember = group.members.some((m) => m.userId === userId);
    if (!isMember) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }

    const payerId = paidByUserId || userId;

    // Check if payer is a member of the group
    const isPayerMember = group.members.some((m) => m.userId === payerId);
    if (!isPayerMember) {
      return res.status(400).json({ error: 'Payer must be a member of this group' });
    }

    // Create the expense
    const expense = await prisma.expense.create({
      data: {
        userId: payerId,
        amount,
        currency: currency || 'INR',
        categoryId,
        description: description || 'Group expense',
        merchant: merchant || '',
        date: date ? new Date(date) : new Date(),
      },
    });

    // Calculate splits
    let splits: any[] = [];

    if (splitType === 'equal') {
      const memberCount = group.members.length;
      const amountPerPerson = amount / memberCount;

      splits = group.members.map((member) => ({
        personId: member.userId,
        amount: member.userId === payerId ? 0 : amountPerPerson,
      }));
    } else if (splitType === 'custom') {
      // Validate custom splits sum to total
      const totalCustom = customSplits.reduce((sum: number, split: any) => sum + split.amount, 0);
      
      if (Math.abs(totalCustom - amount) > 0.01) {
        return res.status(400).json({ 
          error: `Custom splits must sum to ${amount}, got ${totalCustom}` 
        });
      }

      splits = customSplits.map((split: any) => ({
        personId: split.personId,
        amount: split.personId === payerId ? 0 : split.amount,
      }));
    }

    // Create group expense with splits
    const groupExpense = await prisma.groupExpense.create({
      data: {
        groupId,
        expenseId: expense.id,
        paidByUserId: payerId,
        splits: {
          create: splits,
        },
      },
      include: {
        expense: {
          include: { category: true },
        },
        splits: true,
      },
    });

    res.status(201).json(groupExpense);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create group expense' });
  }
});

// ===== GET ALL GROUP EXPENSES =====
router.get('/:groupId', async (req: AuthRequest, res: Response) => {
  try {
    const { groupId } = req.params;
    const userId = req.userId!;

    if (typeof groupId !== 'string') {
      return res.status(400).json({ error: 'Invalid group ID' });
    }

    // Check if user is a member of this group
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { members: true },
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const isMember = group.members.some((m) => m.userId === userId);
    if (!isMember) {
      return res.status(403).json({ error: 'Not a member of this group' });
    }

    // Get all group expenses
    const groupExpenses = await prisma.groupExpense.findMany({
      where: { groupId },
      include: {
        expense: {
          include: { category: true },
        },
        splits: true,
      },
      orderBy: {
        expense: { date: 'desc' },
      },
    });

    res.json(groupExpenses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch group expenses' });
  }
});

// ===== GET GROUP BALANCES (Who owes whom) =====
router.get('/:groupId/balances', async (req: AuthRequest, res: Response) => {
  try {
    const { groupId } = req.params;
    const userId = req.userId!;

    if (typeof groupId !== 'string') {
      return res.status(400).json({ error: 'Invalid group ID' });
    }

    // Check if user is a member
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { members: { include: { user: true } } },
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const isMember = group.members.some((m) => m.userId === userId);
    if (!isMember) {
      return res.status(403).json({ error: 'Not a member of this group' });
    }

    // Get all unsettled splits
    const groupExpenses = await prisma.groupExpense.findMany({
      where: { groupId },
      include: {
        splits: true,
        expense: {
          include: { category: true },
        },
      },
    });

    // Build balance sheet: who owes whom how much
    const balances: Record<string, { from: string; to: string; amount: number; description: string }> = {};

    groupExpenses.forEach((ge) => {
      ge.splits.forEach((split) => {
        if (!split.settled && split.amount > 0) {
          const key = `${split.personId}->${ge.paidByUserId}`;
          
          if (!balances[key]) {
            balances[key] = {
              from: split.personId,
              to: ge.paidByUserId,
              amount: 0,
              description: `Owes for: ${ge.expense.description}`,
            };
          }
          
          balances[key].amount += split.amount;
        }
      });
    });

    const balanceList = Object.values(balances);

    res.json({
      groupId,
      balances: balanceList,
      totalUnsettled: balanceList.reduce((sum, b) => sum + b.amount, 0),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch balances' });
  }
});

// ===== SETTLE A SPLIT (Mark as paid) =====
router.put('/:groupId/splits/:splitId/settle', async (req: AuthRequest, res: Response) => {
  try {
    const { groupId, splitId } = req.params;
    const userId = req.userId!;

    if (typeof groupId !== 'string' || typeof splitId !== 'string') {
      return res.status(400).json({ error: 'Invalid IDs' });
    }

    // Find the split
    const split = await prisma.split.findUnique({
      where: { id: splitId },
      include: { groupExpense: true },
    });

    if (!split) {
      return res.status(404).json({ error: 'Split not found' });
    }

    const groupExpense = await prisma.groupExpense.findUnique({
      where: { id: split.groupExpenseId },
    });

    if (!groupExpense || groupExpense.groupId !== groupId) {
      return res.status(400).json({ error: 'Split does not belong to this group' });
    }

    // Only the person who owes or the person who paid can settle
    if (split.personId !== userId && groupExpense.paidByUserId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to settle this split' });
    }

    // Mark as settled
    const settled = await prisma.split.update({
      where: { id: splitId },
      data: {
        settled: true,
        settledAt: new Date(),
      },
    });

    res.json({
      message: 'Split settled successfully',
      split: settled,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to settle split' });
  }
});

// ===== GET SINGLE GROUP EXPENSE =====
router.get('/:groupId/expenses/:expenseId', async (req: AuthRequest, res: Response) => {
  try {
    const { groupId, expenseId } = req.params;
    const userId = req.userId!;

    if (typeof groupId !== 'string' || typeof expenseId !== 'string') {
      return res.status(400).json({ error: 'Invalid IDs' });
    }

    // Check if user is a member
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { members: true },
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const isMember = group.members.some((m) => m.userId === userId);
    if (!isMember) {
      return res.status(403).json({ error: 'Not a member of this group' });
    }

    // Get the expense
    const groupExpense = await prisma.groupExpense.findFirst({
      where: {
        groupId,
        expenseId,
      },
      include: {
        expense: {
          include: { category: true },
        },
        splits: true,
      },
    });

    if (!groupExpense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json(groupExpense);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch expense' });
  }
});

// ===== DELETE GROUP EXPENSE =====
router.delete('/:groupId/expenses/:expenseId', async (req: AuthRequest, res: Response) => {
  try {
    const { groupId, expenseId } = req.params;
    const userId = req.userId!;

    if (typeof groupId !== 'string' || typeof expenseId !== 'string') {
      return res.status(400).json({ error: 'Invalid IDs' });
    }

    // Get group expense
    const groupExpense = await prisma.groupExpense.findFirst({
      where: {
        groupId,
        expenseId,
      },
    });

    if (!groupExpense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // Check if group exists and user is a member
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { members: true },
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const isMember = group.members.some((m) => m.userId === userId);
    if (!isMember) {
      return res.status(403).json({ error: 'Only group members can delete expenses' });
    }

    // Delete splits first
    await prisma.split.deleteMany({
      where: { groupExpenseId: groupExpense.id },
    });

    // Delete group expense
    await prisma.groupExpense.delete({
      where: { id: groupExpense.id },
    });

    // Delete expense
    await prisma.expense.delete({
      where: { id: expenseId },
    });

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

export default router;