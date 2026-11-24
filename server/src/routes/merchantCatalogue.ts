import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { authenticateToken, requireRole } from '../middleware/auth';
import { resolveProductImage } from '../utils/productImageFallback';
import { getActiveEnvironment } from './adminCatalogue';

const router = Router();

// Guard with MERCHANT role
router.use(authenticateToken);
router.use(requireRole('MERCHANT'));

/**
 * Helper to get the store belonging to the authenticated merchant
 */
async function getMerchantStore(user: any) {
  const store = await prisma.store.findFirst({
    where: { ownerId: user.userId || user.id }
  });
  return store;
}

// 1. GET Search Master Catalogue Products
router.get('/search', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const store = await getMerchantStore(user);
    if (!store) {
      res.status(404).json({ error: 'Merchant store not found' });
      return;
    }

    const q = (req.query.q as string || '').trim();
    const category = req.query.category as string | undefined;
    const department = req.query.department as string | undefined;
    const page = Math.max(1, parseInt(req.query.page as string || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string || '30', 10)));
    const skip = (page - 1) * limit;

    const activeEnv = await getActiveEnvironment();
    const where: any = {
      environment: activeEnv,
      status: 'ACTIVE'
    };

    if (category && category !== 'all') {
      where.OR = [
        { categoryName: { contains: category } },
        { category: { slug: category } }
      ];
    }

    if (department && department !== 'all') {
      where.department = department;
    }

    if (q) {
      where.OR = [
        { name: { contains: q } },
        { brand: { contains: q } },
        { sku: { contains: q } },
        { searchKeywords: { contains: q } }
      ];
    }

    const [catalogueProducts, total] = await Promise.all([
      prisma.catalogueProduct.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          offers: {
            where: { storeId: store.id },
            select: { id: true, pricePaise: true, stock: true, isAvailable: true }
          }
        },
        orderBy: [{ department: 'asc' }, { name: 'asc' }],
        skip,
        take: limit
      }),
      prisma.catalogueProduct.count({ where })
    ]);

    // Format products with merchant-specific offer info
    const items = catalogueProducts.map(cp => {
      const existingOffer = cp.offers[0] || null;
      return {
        id: cp.id,
        sku: cp.sku,
        name: cp.name,
        brand: cp.brand,
        shortDescription: cp.shortDescription,
        categoryName: cp.categoryName,
        department: cp.department,
        unit: cp.unit,
        packageSize: cp.packageSize,
        mrpPaise: cp.mrpPaise,
        targetPricePaise: cp.targetPricePaise,
        imageUrl: cp.imageUrl,
        isPrescriptionRequired: cp.isPrescriptionRequired,
        isService: cp.isService,
        hasExistingOffer: !!existingOffer,
        currentOffer: existingOffer
          ? {
              offerId: existingOffer.id,
              pricePaise: existingOffer.pricePaise,
              stock: existingOffer.stock,
              isAvailable: existingOffer.isAvailable
            }
          : null
      };
    });

    res.json({
      environment: activeEnv,
      products: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to search catalogue', message: error.message });
  }
});

// 2. POST Create or Link Store Offer from Master Catalogue
router.post('/offers', async (req: Request, res: Response): Promise<void> => {
  const offerSchema = z.object({
    catalogueProductId: z.string().uuid(),
    pricePaise: z.number().int().positive(),
    stock: z.number().int().min(0).default(50),
    minOrderQty: z.number().int().positive().default(1),
    isAvailable: z.boolean().default(true)
  });

  try {
    const user = (req as any).user;
    const store = await getMerchantStore(user);
    if (!store) {
      res.status(404).json({ error: 'Merchant store not found' });
      return;
    }

    const { catalogueProductId, pricePaise, stock, minOrderQty, isAvailable } = offerSchema.parse(req.body);

    const masterProduct = await prisma.catalogueProduct.findUnique({
      where: { id: catalogueProductId }
    });

    if (!masterProduct) {
      res.status(404).json({ error: 'Master catalogue product not found' });
      return;
    }

    // Check if offer already exists for this store
    const existingOffer = await prisma.product.findFirst({
      where: {
        storeId: store.id,
        catalogueProductId
      }
    });

    let offer;
    if (existingOffer) {
      // Update existing offer
      offer = await prisma.product.update({
        where: { id: existingOffer.id },
        data: {
          pricePaise,
          stock,
          minOrderQty,
          isAvailable
        }
      });
    } else {
      // Create new offer derived from catalogue product
      offer = await prisma.product.create({
        data: {
          storeId: store.id,
          catalogueProductId: masterProduct.id,
          name: masterProduct.name,
          brand: masterProduct.brand,
          description: masterProduct.description || masterProduct.shortDescription || masterProduct.name,
          category: masterProduct.categoryName,
          categoryId: masterProduct.categoryId,
          subcategoryId: masterProduct.subcategoryId,
          pricePaise,
          mrpPaise: masterProduct.mrpPaise,
          stock: masterProduct.isService ? 999 : stock,
          minOrderQty,
          packageSize: masterProduct.packageSize || masterProduct.unit,
          imageUrl: masterProduct.imageUrl,
          isAvailable,
          environment: masterProduct.environment
        }
      });
    }

    // Write audit log
    await prisma.catalogueAuditLog.create({
      data: {
        actorId: user.userId || user.id,
        actorEmail: user.email,
        action: 'UPDATE_OFFER',
        entityType: 'MERCHANT_OFFER',
        entityId: offer.id,
        environment: masterProduct.environment,
        detailsJson: JSON.stringify({
          storeId: store.id,
          sku: masterProduct.sku,
          pricePaise,
          stock
        })
      }
    });

    res.status(200).json({
      success: true,
      message: existingOffer ? 'Store offer updated' : 'Product successfully listed in store',
      offer
    });
  } catch (error: any) {
    res.status(400).json({ error: 'Failed to create or update store offer', message: error.message });
  }
});

// 3. POST Merchant Submits New Product Proposal
router.post('/requests', async (req: Request, res: Response): Promise<void> => {
  const requestSchema = z.object({
    name: z.string().min(2),
    brand: z.string().optional(),
    categoryName: z.string().min(2),
    categoryId: z.string().optional(),
    subcategoryId: z.string().optional(),
    description: z.string().optional(),
    unit: z.string().default('piece'),
    proposedPricePaise: z.number().int().positive().optional(),
    proposedMrpPaise: z.number().int().positive().optional(),
    imageUrl: z.string().optional()
  });

  try {
    const user = (req as any).user;
    const store = await getMerchantStore(user);
    if (!store) {
      res.status(404).json({ error: 'Merchant store not found' });
      return;
    }

    const data = requestSchema.parse(req.body);
    const activeEnv = await getActiveEnvironment();
    const resolvedImage = resolveProductImage(data.name, data.categoryName, data.imageUrl);

    const productRequest = await prisma.merchantProductRequest.create({
      data: {
        merchantId: user.userId || user.id,
        storeId: store.id,
        name: data.name,
        brand: data.brand || null,
        categoryName: data.categoryName,
        categoryId: data.categoryId || null,
        subcategoryId: data.subcategoryId || null,
        description: data.description || null,
        unit: data.unit,
        proposedPricePaise: data.proposedPricePaise,
        proposedMrpPaise: data.proposedMrpPaise,
        imageUrl: resolvedImage,
        status: 'PENDING',
        environment: activeEnv
      }
    });

    res.status(201).json({
      success: true,
      message: 'Product proposal submitted for Super Admin review.',
      request: productRequest
    });
  } catch (error: any) {
    res.status(400).json({ error: 'Failed to submit product request', message: error.message });
  }
});

// 4. GET Merchant's Own Submitted Requests
router.get('/requests', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const store = await getMerchantStore(user);
    if (!store) {
      res.status(404).json({ error: 'Merchant store not found' });
      return;
    }

    const requests = await prisma.merchantProductRequest.findMany({
      where: { storeId: store.id },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ requests });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch merchant requests', message: error.message });
  }
});

export default router;
