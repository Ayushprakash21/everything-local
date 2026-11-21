import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { authenticateToken, requireRole } from '../middleware/auth';
import { FinancialEngine } from '../core/finance';

const router = Router();

// Guard all admin routes with ADMIN role
router.use(authenticateToken);
router.use(requireRole('ADMIN'));

// 1. Platform Metrics Overview
router.get('/metrics', async (_req: Request, res: Response): Promise<void> => {
  try {
    const orders = await prisma.order.findMany();
    const storesCount = await prisma.store.count();
    const activeStoresCount = await prisma.store.count({ where: { isOpen: true, isVerified: true } });
    const customersCount = await prisma.user.count({ where: { role: 'CUSTOMER' } });

    // Financial Metrics
    const totalGmvPaise = orders.reduce((sum, o) => sum + o.totalAmountPaise, 0);
    const completedOrders = orders.filter((o) => ['DELIVERED', 'COLLECTED'].includes(o.status));
    const completedGmvPaise = completedOrders.reduce((sum, o) => sum + o.totalAmountPaise, 0);
    const platformNetRevenuePaise = completedOrders.reduce((sum, o) => sum + o.platformRevenuePaise, 0);

    res.json({
      metrics: {
        totalOrdersCount: orders.length,
        completedOrdersCount: completedOrders.length,
        totalGmvPaise,
        totalGmvFormatted: FinancialEngine.formatPaiseToRupees(totalGmvPaise),
        completedGmvPaise,
        completedGmvFormatted: FinancialEngine.formatPaiseToRupees(completedGmvPaise),
        platformNetRevenuePaise,
        platformNetRevenueFormatted: FinancialEngine.formatPaiseToRupees(platformNetRevenuePaise),
        totalStoresCount: storesCount,
        activeStoresCount,
        totalCustomersCount: customersCount
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch platform metrics' });
  }
});

// 2. List All Merchants
router.get('/merchants', async (_req: Request, res: Response): Promise<void> => {
  try {
    const stores = await prisma.store.findMany({
      include: {
        owner: { select: { id: true, name: true, email: true, phone: true } },
        _count: { select: { products: true, orders: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ stores });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch merchants' });
  }
});

// 3. Verify or Suspend Merchant Store
const VerifyStoreSchema = z.object({
  isVerified: z.boolean(),
  isOpen: z.boolean().optional()
});

router.post('/merchants/:id/verify', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const parse = VerifyStoreSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: 'Invalid input', details: parse.error.errors });
      return;
    }

    const updated = await prisma.store.update({
      where: { id },
      data: parse.data
    });

    res.json({ message: 'Store verification status updated', store: updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update store verification' });
  }
});

// 4. Update Merchant Commission Rate
router.put('/merchants/:id/commission', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { commissionRatePct } = req.body;

    const rate = parseFloat(commissionRatePct);
    if (isNaN(rate) || rate < 0 || rate > 50) {
      res.status(400).json({ error: 'Commission rate must be between 0% and 50%' });
      return;
    }

    const store = await prisma.store.update({
      where: { id },
      data: { commissionRatePct: rate }
    });

    res.json({ message: 'Commission rate updated', store });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update commission rate' });
  }
});

// 5. Global Orders Monitor
router.get('/orders', async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string;
    const where: any = {};
    if (status && status !== 'all') {
      where.status = status;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        store: { select: { id: true, name: true } },
        items: true,
        events: { orderBy: { createdAt: 'desc' } }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    res.json({ orders });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// 6. Platform Financial Ledger Feed
router.get('/finance/ledger', async (_req: Request, res: Response): Promise<void> => {
  try {
    const entries = await prisma.financialLedgerEntry.findMany({
      include: {
        store: { select: { id: true, name: true } },
        order: { select: { id: true, orderNumber: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    res.json({ entries });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch financial ledger' });
  }
});

// 7. Process Refund
router.post('/finance/refunds/:orderId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    if (order.status === 'REFUNDED') {
      res.status(400).json({ error: 'Order is already refunded' });
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'REFUNDED' }
      });

      // Debit merchant payable ledger entry
      await tx.financialLedgerEntry.create({
        data: {
          orderId: order.id,
          storeId: order.storeId,
          entryType: 'REFUND_DEBIT',
          amountPaise: -order.totalAmountPaise,
          reference: `Refund processed by admin: ${reason || 'Customer request'}`
        }
      });

      // Audit event
      await tx.orderEvent.create({
        data: {
          orderId: order.id,
          status: 'REFUNDED',
          actorId: req.user!.userId,
          note: `Refund issued: ${reason || 'Approved by Admin'}`
        }
      });
    });

    res.json({ message: 'Refund successfully processed and ledger debited' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process refund' });
  }
});

// 8. Platform Settings
router.get('/settings', async (_req: Request, res: Response): Promise<void> => {
  try {
    const settings = await prisma.platformSetting.findMany();
    const defaults = {
      MIN_ORDER_VALUE_PAISE: 29900,
      DEFAULT_COMMISSION_PCT: 3.5,
      DEFAULT_SERVICE_RADIUS_KM: 3.0,
      INDORE_LAUNCH_CITY: 'Indore, Madhya Pradesh'
    };

    res.json({ settings, defaults });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

export default router;
