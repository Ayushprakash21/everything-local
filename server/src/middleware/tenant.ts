import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db';

/**
 * P1 Remediation: Multi-store Merchant Tenancy Middleware
 * 
 * Supports:
 * - One merchant owning multiple stores
 * - Explicit store selection via 'x-store-id' header, route params, query string, or body
 * - Strict authorization check: validates that the merchant actually owns or is authorized
 *   for the target store
 * - Rejects unauthorized access across store boundaries (HTTP 403)
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
    // 1. Identify target store requested by the client
    const requestedStoreId =
      (req.headers['x-store-id'] as string) ||
      (req.query.storeId as string) ||
      (req.params.storeId as string) ||
      (req.body && req.body.storeId) ||
      req.user.storeId;

    let targetStore = null;

    if (requestedStoreId) {
      targetStore = await prisma.store.findFirst({
        where: {
          id: requestedStoreId,
          ownerId: req.user.userId
        }
      });

      if (!targetStore) {
        res.status(403).json({
          error: 'Forbidden: You do not have authorized management permissions for this store.'
        });
        return;
      }
    } else {
      // If no storeId explicitly provided, fetch the merchant's primary store
      targetStore = await prisma.store.findFirst({
        where: { ownerId: req.user.userId },
        orderBy: { createdAt: 'asc' }
      });

      if (!targetStore) {
        res.status(404).json({ error: 'No store found associated with this merchant account' });
        return;
      }
    }

    req.user.storeId = targetStore.id;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify merchant store tenancy' });
  }
}
