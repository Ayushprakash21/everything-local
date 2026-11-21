import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db';

/**
 * Ensures that merchant actions can only access and modify their own store.
 * Prevents cross-store data leakage.
 */
export async function requireMerchantTenant(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user || req.user.role !== 'MERCHANT') {
    res.status(403).json({ error: 'Merchant role required' });
    return;
  }

  try {
    // If storeId is already cached on user token, verify or attach
    const store = await prisma.store.findFirst({
      where: { ownerId: req.user.userId }
    });

    if (!store) {
      res.status(404).json({ error: 'No store found associated with this merchant account' });
      return;
    }

    req.user.storeId = store.id;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify merchant store ownership' });
  }
}
