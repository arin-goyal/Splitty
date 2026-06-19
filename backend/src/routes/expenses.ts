import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { amount, currency, categoryId, description, merchant, date, paymentMethod, tags } = req.body;

    if (!amount || !categoryId) {
      return res.status(400).json({ error: 'Amount and categoryId are required' });
    }

    const expense = await prisma.expense.create({
      data: {
        userId,
        amount,
        currency: currency || 'INR',
        categoryId,
        description,
        merchant,
        date: date ? new Date(date) : new Date(),
        paymentMethod,
        tags: tags || [],
      },
      include: { category: true },
    });

    res.status(201).json(expense);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { startDate, endDate, categoryId, merchant, limit = '50', offset = '0' } = req.query;

    const where: any = { userId };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    if (categoryId) where.categoryId = categoryId;
    if (merchant) where.merchant = { contains: merchant, mode: 'insensitive' };

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        category: true,
        groupExpense: {
          include: {
            group: true,
            splits: true,
          },
        },
      },
      orderBy: { date: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    const total = await prisma.expense.count({ where });

    res.json({ expenses, total, limit: parseInt(limit as string), offset: parseInt(offset as string) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

router.get('/categories', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const categories = await prisma.category.findMany({
      where: {
        OR: [
          { userId: null },
          { userId },
        ],
      },
    });
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

router.post('/categories', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { name, icon } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    // Check if category already exists for this user (either global or custom)
    const existing = await prisma.category.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        OR: [
          { userId: null },
          { userId },
        ],
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'Category already exists' });
    }

    const category = await prisma.category.create({
      data: {
        name,
        icon: icon || '💰',
        userId,
      },
    });

    res.status(201).json(category);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

router.get('/summary/by-category', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const summary = await prisma.expense.groupBy({
      by: ['categoryId'],
      where: { userId },
      _sum: { amount: true },
      _count: true,
    });

    res.json(summary);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    if (typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid expense ID' });
    }

    const expense = await prisma.expense.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    if (expense.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json(expense);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch expense' });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const { amount, categoryId, description, merchant, date, paymentMethod, tags } = req.body;

    if (typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid expense ID' });
    }

    const expense = await prisma.expense.findUnique({ where: { id } });
    
    if (!expense || expense.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updated = await prisma.expense.update({
      where: { id },
      data: {
        amount,
        categoryId,
        description,
        merchant,
        date: date ? new Date(date) : undefined,
        paymentMethod,
        tags,
      },
      include: { category: true },
    });

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    if (typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid expense ID' });
    }

    const expense = await prisma.expense.findUnique({ where: { id } });

    if (!expense || expense.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await prisma.expense.delete({ where: { id } });

    res.json({ message: 'Expense deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

export default router;