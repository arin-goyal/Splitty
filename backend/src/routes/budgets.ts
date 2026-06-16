import express, { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

// GET all budgets for current month
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const currentYearMonth = new Date().toISOString().substring(0, 7); // e.g., "2026-06"
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Query user's budgets for this month
    const userBudgets = await prisma.budget.findMany({
      where: {
        userId,
        month: currentYearMonth,
      },
    });

    const budgetsData = [];
    for (const budget of userBudgets) {
      const categoryObj = await prisma.category.findFirst({
        where: {
          name: budget.category,
          OR: [
            { userId: null },
            { userId },
          ],
        },
      });
      
      const spentAggr = await prisma.expense.aggregate({
        where: {
          userId,
          categoryId: categoryObj?.id,
          date: { gte: startOfMonth },
        },
        _sum: { amount: true },
      });

      budgetsData.push({
        id: budget.id,
        category: budget.category,
        icon: categoryObj?.icon || '💰',
        spent: spentAggr._sum.amount || 0,
        limit: budget.monthlyLimit,
      });
    }

    res.json({ budgets: budgetsData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve budgets' });
  }
});

// POST to create or update a budget
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { category, monthlyLimit, icon } = req.body;

    if (!category || monthlyLimit === undefined) {
      return res.status(400).json({ error: 'Category and monthly limit are required.' });
    }

    const currentYearMonth = new Date().toISOString().substring(0, 7); // e.g., "2026-06"

    // Get or create category
    let dbCategory = await prisma.category.findFirst({
      where: {
        name: category,
        OR: [
          { userId: null },
          { userId },
        ],
      },
    });

    if (!dbCategory) {
      dbCategory = await prisma.category.create({
        data: {
          name: category,
          icon: icon || '💰',
          userId,
        },
      });
    }

    // Upsert budget
    const budget = await prisma.budget.upsert({
      where: {
        userId_category_month: {
          userId,
          category: dbCategory.name,
          month: currentYearMonth,
        },
      },
      update: {
        monthlyLimit: parseFloat(monthlyLimit),
      },
      create: {
        userId,
        category: dbCategory.name,
        monthlyLimit: parseFloat(monthlyLimit),
        month: currentYearMonth,
      },
    });

    res.json({ success: true, budget });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create budget.' });
  }
});

// DELETE a budget
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const id = req.params.id as string;

    const budget = await prisma.budget.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!budget) {
      return res.status(404).json({ error: 'Budget not found.' });
    }

    await prisma.budget.delete({
      where: {
        id,
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete budget.' });
  }
});

export default router;
