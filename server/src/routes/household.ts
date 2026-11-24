import express, { Response } from 'express';
import { prisma } from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';

export const householdRouter = express.Router();

/**
 * 1. Get User's Household & Shopping List
 */
householdRouter.get('/my', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId || req.user!.id!;

    let household = await prisma.household.findFirst({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } }
        ]
      },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
        shoppingItems: { orderBy: { createdAt: 'desc' } }
      }
    });

    // If user doesn't have a household yet, create a default one
    if (!household) {
      household = await prisma.household.create({
        data: {
          name: `${req.user!.email.split('@')[0]}'s Household`,
          ownerId: userId,
          monthlyBudgetPaise: 1500000,
          monthlySpendPaise: 0,
          members: {
            create: {
              userId,
              role: 'ADMIN',
              canSpend: true
            }
          }
        },
        include: {
          members: { include: { user: { select: { id: true, name: true, email: true } } } },
          shoppingItems: true
        }
      });
    }

    res.json({ household });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 2. Add Shopping Item to Household
 */
householdRouter.post('/items', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId || req.user!.id!;
    const { householdId, productName, quantity, unit, estimatedPricePaise, priority, recurringIntervalDays } = req.body;

    const item = await prisma.householdShoppingItem.create({
      data: {
        householdId,
        productName,
        quantity: Number(quantity) || 1,
        unit,
        estimatedPricePaise: estimatedPricePaise ? Number(estimatedPricePaise) : null,
        priority: priority || 'MEDIUM',
        recurringIntervalDays: recurringIntervalDays ? Number(recurringIntervalDays) : null,
        isPurchased: false
      }
    });

    res.status(201).json({ success: true, item });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 3. Toggle Item Purchased Status
 */
householdRouter.post('/items/:id/toggle', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.householdShoppingItem.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    const updated = await prisma.householdShoppingItem.update({
      where: { id },
      data: { isPurchased: !existing.isPurchased }
    });

    res.json({ success: true, item: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 3b. Patch Item Status
 */
householdRouter.patch('/items/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { isPurchased, quantity } = req.body;
    const dataToUpdate: any = {};
    if (typeof isPurchased === 'boolean') dataToUpdate.isPurchased = isPurchased;
    if (quantity !== undefined) dataToUpdate.quantity = Number(quantity);

    const updated = await prisma.householdShoppingItem.update({
      where: { id },
      data: dataToUpdate
    });
    res.json({ success: true, item: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 3c. Delete Item
 */
householdRouter.delete('/items/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.householdShoppingItem.delete({ where: { id } });
    res.json({ success: true, message: 'Item deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 4. Update Household Budget
 */
householdRouter.post('/budget', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { householdId, monthlyBudgetPaise } = req.body;
    const updated = await prisma.household.update({
      where: { id: householdId },
      data: { monthlyBudgetPaise: Number(monthlyBudgetPaise) }
    });

    res.json({ success: true, household: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
