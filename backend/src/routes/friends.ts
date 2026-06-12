import express, { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

// Send a friend request by email
router.post('/request', async (req: AuthRequest, res: Response) => {
  try {
    const senderId = req.userId!;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const receiver = await prisma.user.findUnique({
      where: { email },
    });

    if (!receiver) {
      return res.status(404).json({ error: 'User with this email not found' });
    }

    if (receiver.id === senderId) {
      return res.status(400).json({ error: 'You cannot send a friend request to yourself' });
    }

    // Check if a request already exists between these users
    const existingRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId, receiverId: receiver.id },
          { senderId: receiver.id, receiverId: senderId },
        ],
      },
    });

    if (existingRequest) {
      if (existingRequest.status === 'accepted') {
        return res.status(400).json({ error: 'You are already friends' });
      }
      if (existingRequest.status === 'pending') {
        if (existingRequest.senderId === senderId) {
          return res.status(400).json({ error: 'Friend request is already pending' });
        } else {
          // The other user already sent a request, so let's automatically accept it
          const updated = await prisma.friendRequest.update({
            where: { id: existingRequest.id },
            data: { status: 'accepted' },
          });
          return res.status(200).json({
            message: 'You have accepted the pending friend request from this user',
            request: updated,
          });
        }
      }
      // If it was denied, reset it to pending and update the sender
      const updated = await prisma.friendRequest.update({
        where: { id: existingRequest.id },
        data: {
          senderId,
          receiverId: receiver.id,
          status: 'pending',
        },
      });
      return res.status(200).json(updated);
    }

    const request = await prisma.friendRequest.create({
      data: {
        senderId,
        receiverId: receiver.id,
        status: 'pending',
      },
    });

    res.status(201).json(request);
  } catch (error) {
    console.error('Error sending friend request:', error);
    res.status(500).json({ error: 'Failed to send friend request' });
  }
});

// Get received pending friend requests
router.get('/requests', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const requests = await prisma.friendRequest.findMany({
      where: {
        receiverId: userId,
        status: 'pending',
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching friend requests:', error);
    res.status(500).json({ error: 'Failed to fetch friend requests' });
  }
});

// Accept or deny friend request
router.put('/requests/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const id = req.params.id as string;
    const { status } = req.body;

    if (!status || !['accepted', 'denied'].includes(status)) {
      return res.status(400).json({ error: 'Invalid or missing status ("accepted" or "denied" required)' });
    }

    const request = await prisma.friendRequest.findUnique({
      where: { id },
    });

    if (!request || request.receiverId !== userId) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    const updated = await prisma.friendRequest.update({
      where: { id },
      data: { status },
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating friend request:', error);
    res.status(500).json({ error: 'Failed to update friend request' });
  }
});

// Get all friends (status is 'accepted')
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const friendships = await prisma.friendRequest.findMany({
      where: {
        status: 'accepted',
        OR: [
          { senderId: userId },
          { receiverId: userId },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
        receiver: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    // Map friendships to retrieve the friend's details
    const friends = friendships.map((f) => {
      return f.senderId === userId ? f.receiver : f.sender;
    });

    res.json(friends);
  } catch (error) {
    console.error('Error fetching friends:', error);
    res.status(500).json({ error: 'Failed to fetch friends' });
  }
});

export default router;
