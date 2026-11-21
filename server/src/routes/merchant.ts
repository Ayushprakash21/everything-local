import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { authenticateToken, requireRole } from '../middleware/auth';
import { requireMerchantTenant } from '../middleware/tenant';
import { FinancialEngine } from '../core/finance';

const router = Router();

// All merchant routes require MERCHANT role and JWT auth
router.use(authenticateToken);
router.use(requireRole('MERCHANT'));

// 1. Get or Check Merchant Store
router.get('/store', async (req: Request, res: Response): Promise<void> => {
  try {
    const store = await prisma.store.findFirst({
      where: { ownerId: req.user!.userId },
      include: {
        _count: {
          select: { products: true, orders: true }
        }
      }
    });

    res.json({ store });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch store details' });
  }
});

// 2. Onboard / Register Store
const CreateStoreSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  category: z.string().default('grocery'),
  addressLine: z.string().min(5),
  city: z.string().default('Indore'),
  pincode: z.string().min(6),
  latitude: z.number(),
  longitude: z.number(),
  serviceRadiusKm: z.number().default(3.0)
});

router.post('/store', async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = CreateStoreSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: 'Validation failed', details: parse.error.errors });
      return;
    }

    const existingStore = await prisma.store.findFirst({
      where: { ownerId: req.user!.userId }
    });

    if (existingStore) {
      res.status(400).json({ error: 'Merchant already has a registered store' });
      return;
    }

    const { name, description, category, addressLine, city, pincode, latitude, longitude, serviceRadiusKm } = parse.data;

    const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.floor(100 + Math.random() * 900)}`;

    const store = await prisma.store.create({
      data: {
        ownerId: req.user!.userId,
        name,
        slug,
        description,
        category,
        addressLine,
        city,
        pincode,
        latitude,
        longitude,
        serviceRadiusKm,
        isOpen: true,
        isVerified: true, // Auto-verified for pilot testing
        commissionRatePct: 3.5
      }
    });

    res.status(201).json({ message: 'Store created successfully', store });
  } catch (error) {
    console.error('Store creation error:', error);
    res.status(500).json({ error: 'Failed to create store' });
  }
});

// 3. Update Store Profile & Operating Status
router.put('/store', requireMerchantTenant, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, category, isOpen, serviceRadiusKm } = req.body;

    const updatedStore = await prisma.store.update({
      where: { id: req.user!.storeId },
      data: {
        ...(name ? { name } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(category ? { category } : {}),
        ...(isOpen !== undefined ? { isOpen } : {}),
        ...(serviceRadiusKm ? { serviceRadiusKm: Number(serviceRadiusKm) } : {})
      }
    });

    res.json({ message: 'Store updated successfully', store: updatedStore });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update store' });
  }
});

// 4. List Products (Merchant Tenant Isolated)
router.get('/products', requireMerchantTenant, async (req: Request, res: Response): Promise<void> => {
  try {
    const products = await prisma.product.findMany({
      where: { storeId: req.user!.storeId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ products });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// 5. Add Product
const ProductSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  category: z.string().min(2),
  mrpPaise: z.number().int().min(0),
  pricePaise: z.number().int().min(0),
  stock: z.number().int().min(0),
  isAvailable: z.boolean().default(true),
  imageUrl: z.string().optional(),
  sku: z.string().optional()
});

router.post('/products', requireMerchantTenant, async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = ProductSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: 'Validation failed', details: parse.error.errors });
      return;
    }

    const product = await prisma.product.create({
      data: {
        ...parse.data,
        storeId: req.user!.storeId!
      }
    });

    res.status(201).json({ message: 'Product added successfully', product });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// 6. Update Product
router.put('/products/:id', requireMerchantTenant, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Tenant check: ensure product belongs to this merchant's store
    const product = await prisma.product.findFirst({
      where: { id, storeId: req.user!.storeId }
    });

    if (!product) {
      res.status(404).json({ error: 'Product not found or access denied' });
      return;
    }

    const updated = await prisma.product.update({
      where: { id },
      data: req.body
    });

    res.json({ message: 'Product updated', product: updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// 7. Delete Product
router.delete('/products/:id', requireMerchantTenant, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findFirst({
      where: { id, storeId: req.user!.storeId }
    });

    if (!product) {
      res.status(404).json({ error: 'Product not found or access denied' });
      return;
    }

    await prisma.product.delete({ where: { id } });
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// 8. List Store Orders
router.get('/orders', requireMerchantTenant, async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string;

    const where: any = { storeId: req.user!.storeId };
    if (status && status !== 'all') {
      where.status = status;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        items: true,
        events: { orderBy: { createdAt: 'desc' } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ orders });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch store orders' });
  }
});

// 9. Update Order Status (Accept, Reject, Preparing, Dispatch, Delivered)
const OrderStatusSchema = z.object({
  status: z.enum([
    'ACCEPTED',
    'REJECTED',
    'PREPARING',
    'READY_FOR_PICKUP',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'COLLECTED'
  ]),
  note: z.string().optional()
});

router.post('/orders/:id/status', requireMerchantTenant, async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = OrderStatusSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: 'Invalid status', details: parse.error.errors });
      return;
    }

    const { status, note } = parse.data;
    const { id } = req.params;

    // Tenant check: ensure order belongs to this store
    const order = await prisma.order.findFirst({
      where: { id, storeId: req.user!.storeId },
      include: { items: true, store: true }
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found or unauthorized' });
      return;
    }

    await prisma.$transaction(async (tx) => {
      // If REJECTED, rollback reserved inventory
      if (status === 'REJECTED' && order.status === 'PLACED') {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } }
          });
        }
      }

      // If completing (DELIVERED or COLLECTED), write to FinancialLedger
      if ((status === 'DELIVERED' || status === 'COLLECTED') && order.status !== 'DELIVERED' && order.status !== 'COLLECTED') {
        // Record Merchant Order Sale credit
        await tx.financialLedgerEntry.create({
          data: {
            orderId: order.id,
            storeId: order.storeId,
            entryType: 'ORDER_SALE',
            amountPaise: order.merchantPayablePaise,
            runningBalancePaise: order.merchantPayablePaise,
            reference: `Payout credit for order ${order.orderNumber}`
          }
        });

        // Record Platform Commission Fee debit
        await tx.financialLedgerEntry.create({
          data: {
            orderId: order.id,
            storeId: order.storeId,
            entryType: 'COMMISSION_FEE',
            amountPaise: -order.commissionPaise,
            runningBalancePaise: order.merchantPayablePaise - order.commissionPaise,
            reference: `Platform commission for order ${order.orderNumber}`
          }
        });
      }

      // Update Order Status
      await tx.order.update({
        where: { id: order.id },
        data: { status }
      });

      // Append Order Event Timeline
      await tx.orderEvent.create({
        data: {
          orderId: order.id,
          status,
          actorId: req.user!.userId,
          note: note || `Status updated to ${status} by merchant`
        }
      });
    });

    const updated = await prisma.order.findUnique({
      where: { id },
      include: { items: true, events: true }
    });

    res.json({ message: `Order status updated to ${status}`, order: updated });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// 10. Merchant Commission & Financial Statements
router.get('/finance/statements', requireMerchantTenant, async (req: Request, res: Response): Promise<void> => {
  try {
    const storeId = req.user!.storeId!;

    const completedOrders = await prisma.order.findMany({
      where: {
        storeId,
        status: { in: ['DELIVERED', 'COLLECTED'] }
      }
    });

    const totalGrossSalesPaise = completedOrders.reduce((sum, o) => sum + o.itemSubtotalPaise, 0);
    const totalCommissionWithheldPaise = completedOrders.reduce((sum, o) => sum + o.commissionPaise, 0);
    const totalNetPayablePaise = completedOrders.reduce((sum, o) => sum + o.merchantPayablePaise, 0);

    const ledgerEntries = await prisma.financialLedgerEntry.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    res.json({
      summary: {
        completedOrdersCount: completedOrders.length,
        totalGrossSalesPaise,
        totalGrossSalesFormatted: FinancialEngine.formatPaiseToRupees(totalGrossSalesPaise),
        totalCommissionWithheldPaise,
        totalCommissionWithheldFormatted: FinancialEngine.formatPaiseToRupees(totalCommissionWithheldPaise),
        totalNetPayablePaise,
        totalNetPayableFormatted: FinancialEngine.formatPaiseToRupees(totalNetPayablePaise),
        commissionRatePct: completedOrders[0]?.storeId ? 3.5 : 3.5
      },
      ledgerEntries
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch financial statements' });
  }
});

export default router;
