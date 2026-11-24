import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { authenticateToken, requireRole } from '../middleware/auth';
import { requireMerchantTenant } from '../middleware/tenant';
import { FinancialEngine } from '../core/finance';
import { lookupBarcode, searchCatalogue } from '../core/catalogue';
import { MultiStoreOrderEngine } from '../core/multiStoreOrderEngine';
import { MerchantSettlementEngine } from '../core/merchantSettlementEngine';

const router = Router();

// All merchant routes require MERCHANT role and JWT auth
router.use(authenticateToken);
router.use(requireRole('MERCHANT'));

// 1. Get Active or Primary Merchant Store
router.get('/store', async (req: Request, res: Response): Promise<void> => {
  try {
    const requestedStoreId = (req.headers['x-store-id'] as string) || (req.query.storeId as string);
    if (requestedStoreId) {
      const store = await prisma.store.findFirst({
        where: {
          id: requestedStoreId,
          ownerId: req.user!.userId
        },
        include: {
          _count: {
            select: { products: true, orders: true }
          }
        }
      });

      if (!store) {
        res.status(403).json({
          error: 'Forbidden: You do not have authorized management permissions for this store.'
        });
        return;
      }

      res.json({ store });
      return;
    }

    const store = await prisma.store.findFirst({
      where: {
        ownerId: req.user!.userId
      },
      orderBy: { createdAt: 'asc' },
      include: {
        _count: {
          select: { products: true, orders: true }
        }
      }
    });

    if (!store) {
      res.status(404).json({ error: 'No store found associated with this merchant account' });
      return;
    }

    res.json({ store });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch store details' });
  }
});

// 1b. List All Stores Owned by Merchant (Multi-Store Tenancy)
router.get('/stores', async (req: Request, res: Response): Promise<void> => {
  try {
    const stores = await prisma.store.findMany({
      where: { ownerId: req.user!.userId },
      include: {
        _count: {
          select: { products: true, orders: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ stores, count: stores.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch merchant stores' });
  }
});

// 2. Onboard / Register Store (Supports Multi-Store Ownership)
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
        isVerified: false, // Statutory KYC: strictly false upon creation; requires ADMIN verification
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

// 4b. Catalogue Barcode Lookup (External Open Food Facts with local caching)
router.get('/catalogue/lookup', requireMerchantTenant, async (req: Request, res: Response): Promise<void> => {
  try {
    const { barcode } = req.query;
    if (!barcode || typeof barcode !== 'string') {
      res.status(400).json({ error: 'Barcode query parameter is required' });
      return;
    }

    const result = await lookupBarcode(barcode);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Catalogue lookup failed' });
  }
});

// 4c. Catalogue Keyword Search
router.get('/catalogue/search', requireMerchantTenant, async (req: Request, res: Response): Promise<void> => {
  try {
    const { query, limit } = req.query;
    if (!query || typeof query !== 'string') {
      res.status(400).json({ error: 'Search query parameter is required' });
      return;
    }

    const pageSize = limit ? Math.min(parseInt(limit as string, 10) || 5, 20) : 5;
    const results = await searchCatalogue(query, pageSize);
    res.json({ results });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Catalogue search failed' });
  }
});

// 5. Add Product
const ProductSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  category: z.string().min(2),
  categoryId: z.string().optional().nullable(),
  subcategoryId: z.string().optional().nullable(),
  mrpPaise: z.number().int().min(0),
  pricePaise: z.number().int().min(0),
  stock: z.number().int().min(0),
  isAvailable: z.boolean().default(true),
  imageUrl: z.string().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  brand: z.string().optional(),
  packageSize: z.string().optional()
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

// 6. Update Product (Strict Schema Whitelist to Prevent Mass Assignment - VULN-007)
const UpdateProductSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  category: z.string().min(2).optional(),
  categoryId: z.string().optional().nullable(),
  subcategoryId: z.string().optional().nullable(),
  mrpPaise: z.number().int().min(0).optional(),
  pricePaise: z.number().int().min(0).optional(),
  stock: z.number().int().min(0).optional(),
  isAvailable: z.boolean().optional(),
  imageUrl: z.string().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  brand: z.string().optional(),
  packageSize: z.string().optional()
});

router.put('/products/:id', requireMerchantTenant, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const parse = UpdateProductSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: 'Validation failed', details: parse.error.errors });
      return;
    }

    // Tenant check: ensure product belongs to this merchant's store
    const product = await prisma.product.findFirst({
      where: { id, storeId: req.user!.storeId }
    });

    if (!product) {
      res.status(404).json({ error: 'Product not found or access denied' });
      return;
    }

    // Explicitly update only validated, whitelisted attributes
    const updated = await prisma.product.update({
      where: { id },
      data: parse.data
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
    'COLLECTED'
  ]),
  note: z.string().optional()
});

router.post('/orders/:id/status', requireMerchantTenant, async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = OrderStatusSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({
        error: 'Invalid status',
        details: parse.error.errors,
        message: 'Merchants can only set ACCEPTED, REJECTED, PREPARING, READY_FOR_PICKUP, or COLLECTED (for counter pickups). Delivery orders must be completed via delivery partner verification.'
      });
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

    // Security Gate (VULN-008): Only PICKUP orders can be marked COLLECTED by the merchant.
    if (status === 'COLLECTED' && order.fulfillmentMode !== 'PICKUP') {
      res.status(400).json({
        error: 'Forbidden status transition: Only PICKUP orders can be marked as COLLECTED by merchants. Platform delivery orders require delivery partner OTP completion.'
      });
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

      // If completing (COLLECTED for counter pickup), write to FinancialLedger
      if (status === 'COLLECTED' && order.status !== 'COLLECTED') {
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

// ============================================================
// VERSION 1.0 MERCHANT CHILD ORDER & SETTLEMENT ENGINE
// ============================================================

// 12. List Merchant Child Orders
router.get('/orders/child', requireMerchantTenant, async (req: Request, res: Response): Promise<void> => {
  try {
    const storeId = req.user!.storeId!;
    const childOrders = await prisma.merchantChildOrder.findMany({
      where: { storeId },
      include: {
        items: true,
        parentOrder: {
          select: {
            orderNumber: true,
            deliveryAddress: true,
            deliveryTier: true,
            createdAt: true
          }
        },
        deliveryTasks: {
          include: {
            rider: {
              include: {
                user: { select: { name: true, phone: true } },
                vehicles: { where: { isActive: true }, take: 1 }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ childOrders });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 13. Accept Merchant Child Order
router.post('/orders/child/:id/accept', requireMerchantTenant, async (req: Request, res: Response): Promise<void> => {
  try {
    const storeId = req.user!.storeId!;
    const { id } = req.params;

    const child = await prisma.merchantChildOrder.findFirst({
      where: { id, storeId }
    });

    if (!child) {
      res.status(404).json({ error: 'Child order not found for this merchant' });
      return;
    }

    const updated = await prisma.merchantChildOrder.update({
      where: { id },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date()
      }
    });

    res.json({ success: true, childOrder: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 14. Reject Merchant Child Order with Independent Partial Rejection Handling
router.post('/orders/child/:id/reject', requireMerchantTenant, async (req: Request, res: Response): Promise<void> => {
  try {
    const storeId = req.user!.storeId!;
    const { id } = req.params;
    const { reason } = req.body;

    const child = await prisma.merchantChildOrder.findFirst({
      where: { id, storeId }
    });

    if (!child) {
      res.status(404).json({ error: 'Child order not found for this merchant' });
      return;
    }

    const rejectionResult = await MultiStoreOrderEngine.handlePartialMerchantRejection(
      id,
      reason || 'Merchant out of stock'
    );

    res.json({
      success: true,
      message: 'Child order rejected; remaining store orders preserved and customer refunded',
      result: rejectionResult
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 15. Mark Child Order Ready For Pickup
router.post('/orders/child/:id/ready', requireMerchantTenant, async (req: Request, res: Response): Promise<void> => {
  try {
    const storeId = req.user!.storeId!;
    const { id } = req.params;

    const child = await prisma.merchantChildOrder.findFirst({
      where: { id, storeId }
    });

    if (!child) {
      res.status(404).json({ error: 'Child order not found for this merchant' });
      return;
    }

    const updated = await prisma.merchantChildOrder.update({
      where: { id },
      data: {
        status: 'READY_FOR_PICKUP',
        readyAt: new Date()
      }
    });

    res.json({ success: true, childOrder: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 16. Merchant Settlement Statements
router.get('/settlements/statements', requireMerchantTenant, async (req: Request, res: Response): Promise<void> => {
  try {
    const storeId = req.user!.storeId!;
    const statements = await prisma.merchantSettlementStatement.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate live current settlement
    const now = new Date();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
    const liveCalc = await MerchantSettlementEngine.calculateSettlement(storeId, thirtyDaysAgo, now);

    // Fetch verified bank account details for payout display
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: {
        owner: {
          include: {
            merchantApplications: {
              where: { status: { in: ['APPROVED', 'ACTIVE'] } },
              include: { bankAccount: true },
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        }
      }
    });

    const bankAccount = store?.owner.merchantApplications[0]?.bankAccount || null;

    res.json({
      currentUnsettled: liveCalc,
      settlementCycle: 'T+1 (Next Business Day)',
      payoutBank: bankAccount
        ? {
            bankName: bankAccount.bankName,
            branchName: bankAccount.branchName,
            accountHolderName: bankAccount.accountHolderName,
            accountNumberMasked: bankAccount.accountNumberMasked,
            ifsc: bankAccount.ifsc,
            verificationStatus: bankAccount.verificationStatus,
            pennyDropStatus: bankAccount.pennyDropStatus
          }
        : null,
      statements
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// PHASE 9: MERCHANT PAID ADVERTISING ENGINE
// ==========================================

const CreateAdCampaignSchema = z.object({
  title: z.string().min(3),
  placement: z.enum([
    'HERO_BANNER',
    'PROMO_CAROUSEL',
    'SPONSORED_PRODUCT',
    'FEATURED_MERCHANT',
    'CATEGORY_PROMOTION'
  ]),
  headline: z.string().min(5),
  description: z.string().optional(),
  creativeUrl: z.string().optional(),
  targetCategory: z.string().optional(),
  targetLocality: z.string().default('All Indore'),
  dailyBudgetPaise: z.number().int().min(5000), // Min ₹50/day
  totalBudgetPaise: z.number().int().min(20000), // Min ₹200 total
  pricingModel: z.enum(['CPC', 'CPM', 'FIXED']).default('CPC'),
  durationDays: z.number().int().min(1).max(90).default(7)
});

// 17. List Merchant Ad Campaigns
router.get('/ads', requireMerchantTenant, async (req: Request, res: Response): Promise<void> => {
  try {
    const storeId = req.user!.storeId!;
    const campaigns = await prisma.adCampaign.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ campaigns, count: campaigns.length });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch advertising campaigns' });
  }
});

// 18. Create New Ad Campaign
router.post('/ads', requireMerchantTenant, async (req: Request, res: Response): Promise<void> => {
  try {
    const storeId = req.user!.storeId!;
    const parse = CreateAdCampaignSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: 'Validation failed', details: parse.error.errors });
      return;
    }

    const {
      title,
      placement,
      headline,
      description,
      creativeUrl,
      targetCategory,
      targetLocality,
      dailyBudgetPaise,
      totalBudgetPaise,
      pricingModel,
      durationDays
    } = parse.data;

    const startsAt = new Date();
    const endsAt = new Date(Date.now() + durationDays * 86400000);

    const campaign = await prisma.adCampaign.create({
      data: {
        storeId,
        title,
        placement,
        headline,
        description,
        creativeUrl,
        targetCategory,
        targetLocality,
        dailyBudgetPaise,
        totalBudgetPaise,
        pricingModel,
        status: 'PENDING_APPROVAL',
        startsAt,
        endsAt
      }
    });

    res.status(201).json({
      message: 'Ad campaign created and submitted for platform governance approval',
      campaign
    });
  } catch (error: any) {
    console.error('Create ad campaign error:', error);
    res.status(500).json({ error: 'Failed to create ad campaign' });
  }
});

// 19. Pause or Resume Ad Campaign
router.patch('/ads/:id/status', requireMerchantTenant, async (req: Request, res: Response): Promise<void> => {
  try {
    const storeId = req.user!.storeId!;
    const { id } = req.params;
    const { status } = req.body;

    if (!['ACTIVE', 'PAUSED', 'CANCELLED'].includes(status)) {
      res.status(400).json({ error: 'Invalid campaign status transition' });
      return;
    }

    const campaign = await prisma.adCampaign.findFirst({
      where: { id, storeId }
    });

    if (!campaign) {
      res.status(404).json({ error: 'Ad campaign not found' });
      return;
    }

    const updated = await prisma.adCampaign.update({
      where: { id },
      data: { status }
    });

    res.json({ message: `Campaign status updated to ${status}`, campaign: updated });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update campaign status' });
  }
});

// 20. Ad Campaign Analytics & Performance Metrics
router.get('/ads/:id/analytics', requireMerchantTenant, async (req: Request, res: Response): Promise<void> => {
  try {
    const storeId = req.user!.storeId!;
    const { id } = req.params;

    const campaign = await prisma.adCampaign.findFirst({
      where: { id, storeId }
    });

    if (!campaign) {
      res.status(404).json({ error: 'Ad campaign not found' });
      return;
    }

    const impressions = campaign.impressions;
    const clicks = campaign.clicks;
    const conversions = campaign.conversions;
    const spentPaise = campaign.spentPaise;

    const ctrPct = impressions > 0 ? Math.round((clicks / impressions) * 10000) / 100 : 0.0;
    const avgCpcPaise = clicks > 0 ? Math.round(spentPaise / clicks) : 0;
    const conversionRatePct = clicks > 0 ? Math.round((conversions / clicks) * 10000) / 100 : 0.0;

    res.json({
      campaignId: campaign.id,
      title: campaign.title,
      status: campaign.status,
      placement: campaign.placement,
      metrics: {
        impressions,
        clicks,
        ctrPct,
        conversions,
        conversionRatePct,
        totalBudgetPaise: campaign.totalBudgetPaise,
        spentPaise,
        remainingBudgetPaise: Math.max(0, campaign.totalBudgetPaise - spentPaise),
        avgCpcPaise
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch campaign analytics' });
  }
});

export default router;
