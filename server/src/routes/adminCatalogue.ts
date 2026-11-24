import { Router, Request, Response } from 'express';
import { z } from 'zod';
import path from 'path';
import fs from 'fs';
import { prisma } from '../db';
import { authenticateToken, requireRole } from '../middleware/auth';
import { resolveProductImage } from '../utils/productImageFallback';

const router = Router();

// Guard all admin catalogue routes with ADMIN role
router.use(authenticateToken);
router.use(requireRole('ADMIN'));

/**
 * Helper to determine current active catalogue environment
 */
export async function getActiveEnvironment(): Promise<'DEMO' | 'LIVE'> {
  try {
    const latestSwitch = await prisma.catalogueAuditLog.findFirst({
      where: { action: 'SWITCH_ENV' },
      orderBy: { createdAt: 'desc' }
    });
    if (latestSwitch && latestSwitch.environment === 'LIVE') {
      return 'LIVE';
    }
    return 'DEMO';
  } catch {
    return 'DEMO';
  }
}

// 1. GET Status of Catalogue Environments (DEMO and LIVE metrics)
router.get('/status', async (_req: Request, res: Response): Promise<void> => {
  try {
    const activeEnvironment = await getActiveEnvironment();

    // Query Demo metrics
    const [
      demoProductsCount,
      demoOffersCount,
      demoActiveStoresCount,
      demoCategoriesCount,
      demoServicesCount
    ] = await Promise.all([
      prisma.catalogueProduct.count({ where: { environment: 'DEMO' } }),
      prisma.product.count({ where: { environment: 'DEMO' } }),
      prisma.store.count({ where: { products: { some: { environment: 'DEMO' } } } }),
      prisma.productCategory.count({ where: { parentId: null } }),
      prisma.catalogueProduct.count({ where: { environment: 'DEMO', isService: true } })
    ]);

    // Query Live metrics
    const [
      liveProductsCount,
      liveOffersCount,
      liveActiveStoresCount,
      livePendingRequestsCount
    ] = await Promise.all([
      prisma.catalogueProduct.count({ where: { environment: 'LIVE' } }),
      prisma.product.count({ where: { environment: 'LIVE' } }),
      prisma.store.count({ where: { isVerified: true, products: { some: { environment: 'LIVE' } } } }),
      prisma.merchantProductRequest.count({ where: { status: 'PENDING' } })
    ]);

    // Latest environment switch details
    const lastSwitch = await prisma.catalogueAuditLog.findFirst({
      where: { action: 'SWITCH_ENV' },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      activeEnvironment,
      demo: {
        totalProducts: demoProductsCount,
        activeOffers: demoOffersCount,
        participatingStores: demoActiveStoresCount,
        topCategories: demoCategoriesCount,
        servicesCount: demoServicesCount,
        isPopulated: demoProductsCount >= 500,
        status: 'READY'
      },
      live: {
        totalProducts: liveProductsCount,
        activeOffers: liveOffersCount,
        verifiedStores: liveActiveStoresCount,
        pendingMerchantRequests: livePendingRequestsCount,
        isPopulated: liveProductsCount > 0,
        status: liveProductsCount > 0 ? 'OPERATIONAL' : 'AWAITING_VERIFIED_MERCHANTS'
      },
      lastSwitchedAt: lastSwitch?.createdAt || null,
      lastSwitchedBy: lastSwitch?.actorEmail || 'System Initializer'
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch catalogue environment status', message: error.message });
  }
});

// 2. POST Switch Active Catalogue Environment (Super Admin Only)
router.post('/switch', async (req: Request, res: Response): Promise<void> => {
  const switchSchema = z.object({
    targetEnvironment: z.enum(['DEMO', 'LIVE']),
    confirmText: z.string().optional(),
    reason: z.string().optional()
  });

  try {
    const { targetEnvironment, confirmText, reason } = switchSchema.parse(req.body);
    const user = (req as any).user;

    // Safety checks for switching to LIVE
    if (targetEnvironment === 'LIVE') {
      if (confirmText !== 'SWITCH_TO_LIVE') {
        res.status(400).json({
          error: 'Explicit confirmation required',
          message: 'Must provide confirmText: "SWITCH_TO_LIVE" to activate LIVE commerce environment.'
        });
        return;
      }
    }

    const currentEnv = await getActiveEnvironment();
    if (currentEnv === targetEnvironment) {
      res.json({
        message: `Catalogue is already active in ${targetEnvironment} environment`,
        activeEnvironment: targetEnvironment
      });
      return;
    }

    // Write audit log entry
    await prisma.catalogueAuditLog.create({
      data: {
        actorId: user?.userId || user?.id,
        actorEmail: user?.email,
        action: 'SWITCH_ENV',
        entityType: 'ENVIRONMENT',
        entityId: targetEnvironment,
        environment: targetEnvironment,
        detailsJson: JSON.stringify({
          previousEnvironment: currentEnv,
          reason: reason || `Manual switch by ${user?.email || 'admin'}`
        })
      }
    });

    res.json({
      success: true,
      message: `Active catalogue successfully switched from ${currentEnv} to ${targetEnvironment}`,
      activeEnvironment: targetEnvironment,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(400).json({ error: 'Failed to switch catalogue environment', message: error.message });
  }
});

// 3. GET Filterable and Paginated Catalogue Products
router.get('/products', async (req: Request, res: Response): Promise<void> => {
  try {
    const environment = (req.query.environment as string) || 'DEMO';
    const category = req.query.category as string | undefined;
    const department = req.query.department as string | undefined;
    const search = req.query.search as string | undefined;
    const status = req.query.status as string | undefined;
    const page = Math.max(1, parseInt(req.query.page as string || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string || '50', 10)));
    const skip = (page - 1) * limit;

    const where: any = { environment };

    if (category && category !== 'all') {
      where.OR = [
        { categoryName: { contains: category } },
        { category: { slug: category } }
      ];
    }

    if (department && department !== 'all') {
      where.department = department;
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    if (search && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { name: { contains: q } },
        { brand: { contains: q } },
        { sku: { contains: q } },
        { searchKeywords: { contains: q } }
      ];
    }

    const [products, total] = await Promise.all([
      prisma.catalogueProduct.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          subcategory: { select: { id: true, name: true, slug: true } },
          _count: { select: { offers: true } }
        },
        orderBy: [{ department: 'asc' }, { name: 'asc' }],
        skip,
        take: limit
      }),
      prisma.catalogueProduct.count({ where })
    ]);

    res.json({
      environment,
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch catalogue products', message: error.message });
  }
});

// 4. POST Create New Catalogue Product
router.post('/products', async (req: Request, res: Response): Promise<void> => {
  const createProductSchema = z.object({
    sku: z.string().min(3),
    name: z.string().min(2),
    brand: z.string().optional().nullable(),
    categoryName: z.string().min(2),
    categoryId: z.string().optional().nullable(),
    subcategoryId: z.string().optional().nullable(),
    department: z.string().optional().nullable(),
    unit: z.string().default('piece'),
    packageSize: z.string().optional().nullable(),
    shortDescription: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    searchKeywords: z.string().optional().nullable(),
    imageUrl: z.string().optional().nullable(),
    mrpPaise: z.number().int().positive(),
    targetPricePaise: z.number().int().positive().optional().nullable(),
    isPrescriptionRequired: z.boolean().default(false),
    isService: z.boolean().default(false),
    environment: z.enum(['DEMO', 'LIVE']).default('DEMO'),
    status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING_REVIEW']).default('ACTIVE')
  });

  try {
    const data = createProductSchema.parse(req.body);
    const user = (req as any).user;

    // Resolve image fallback if blank
    const resolvedImage = resolveProductImage(data.name, data.categoryName, data.imageUrl);

    // Create product
    const slug = `${data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`;
    const product = await prisma.catalogueProduct.create({
      data: {
        ...data,
        slug,
        imageUrl: resolvedImage,
        targetPricePaise: data.targetPricePaise || Math.round(data.mrpPaise * 0.9)
      }
    });

    // Write audit log
    await prisma.catalogueAuditLog.create({
      data: {
        actorId: user?.userId || user?.id,
        actorEmail: user?.email,
        action: 'CREATE_PRODUCT',
        entityType: 'CATALOGUE_PRODUCT',
        entityId: product.id,
        environment: product.environment,
        detailsJson: JSON.stringify({ sku: product.sku, name: product.name, mrpPaise: product.mrpPaise })
      }
    });

    res.status(201).json({ success: true, product });
  } catch (error: any) {
    res.status(400).json({ error: 'Failed to create catalogue product', message: error.message });
  }
});

// 5. PUT Update Catalogue Product
router.put('/products/:id', async (req: Request, res: Response): Promise<void> => {
  const updateProductSchema = z.object({
    name: z.string().min(2).optional(),
    brand: z.string().optional().nullable(),
    categoryName: z.string().optional(),
    categoryId: z.string().optional().nullable(),
    subcategoryId: z.string().optional().nullable(),
    department: z.string().optional().nullable(),
    unit: z.string().optional(),
    packageSize: z.string().optional().nullable(),
    shortDescription: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    searchKeywords: z.string().optional().nullable(),
    imageUrl: z.string().optional().nullable(),
    mrpPaise: z.number().int().positive().optional(),
    targetPricePaise: z.number().int().positive().optional().nullable(),
    isPrescriptionRequired: z.boolean().optional(),
    isService: z.boolean().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING_REVIEW']).optional()
  });

  try {
    const id = req.params.id;
    const updates = updateProductSchema.parse(req.body);
    const user = (req as any).user;

    const existing = await prisma.catalogueProduct.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Catalogue product not found' });
      return;
    }

    if (updates.name && (!updates.imageUrl || updates.imageUrl.trim() === '')) {
      updates.imageUrl = resolveProductImage(updates.name, updates.categoryName || existing.categoryName, existing.imageUrl);
    }

    const updated = await prisma.catalogueProduct.update({
      where: { id },
      data: updates as any
    });

    // Write audit log
    await prisma.catalogueAuditLog.create({
      data: {
        actorId: user?.userId || user?.id,
        actorEmail: user?.email,
        action: 'UPDATE_PRODUCT',
        entityType: 'CATALOGUE_PRODUCT',
        entityId: id,
        environment: updated.environment,
        detailsJson: JSON.stringify(updates)
      }
    });

    res.json({ success: true, product: updated });
  } catch (error: any) {
    res.status(400).json({ error: 'Failed to update catalogue product', message: error.message });
  }
});

// 6. DELETE / Deactivate Catalogue Product
router.delete('/products/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    const user = (req as any).user;

    const existing = await prisma.catalogueProduct.findUnique({
      where: { id },
      include: { _count: { select: { offers: true } } }
    });

    if (!existing) {
      res.status(404).json({ error: 'Catalogue product not found' });
      return;
    }

    // Deactivate instead of hard delete to preserve referential integrity
    const deactivated = await prisma.catalogueProduct.update({
      where: { id },
      data: { status: 'INACTIVE' }
    });

    await prisma.catalogueAuditLog.create({
      data: {
        actorId: user?.userId || user?.id,
        actorEmail: user?.email,
        action: 'DELETE_PRODUCT',
        entityType: 'CATALOGUE_PRODUCT',
        entityId: id,
        environment: deactivated.environment,
        detailsJson: JSON.stringify({ deactivatedSku: existing.sku, activeOffersCount: existing._count.offers })
      }
    });

    res.json({ success: true, message: `Product ${existing.name} set to INACTIVE.` });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to deactivate catalogue product', message: error.message });
  }
});

// 7. POST Reset Demo Data to 500 Seeded Products (Safe: Fails closed in LIVE)
router.post('/demo/reset', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const activeEnvironment = await getActiveEnvironment();

    // NON-NEGOTIABLE SAFETY GATE: Never reset if currently in LIVE environment
    if (activeEnvironment === 'LIVE') {
      res.status(403).json({
        error: 'Operation Forbidden in LIVE Environment',
        message: 'Demo dataset reset is strictly forbidden while the platform is operating in LIVE mode.'
      });
      return;
    }

    const dataPath = path.resolve(__dirname, '../../../scripts/data/products-500.json');
    if (!fs.existsSync(dataPath)) {
      res.status(500).json({ error: '500 products seed dataset file missing at ' + dataPath });
      return;
    }

    const rawData = fs.readFileSync(dataPath, 'utf-8');
    const items = JSON.parse(rawData);

    // Delete existing DEMO merchant offers first
    await prisma.product.deleteMany({
      where: { environment: 'DEMO' }
    });

    // Upsert the 500 products
    let upsertedCount = 0;
    for (const item of items) {
      await prisma.catalogueProduct.upsert({
        where: { sku: item.sku },
        update: {
          name: item.name,
          brand: item.brand,
          shortDescription: item.shortDescription,
          description: item.description,
          categoryName: item.categoryName,
          department: item.department,
          unit: item.unit,
          packageSize: item.packageSize,
          imageUrl: item.imageUrl,
          mrpPaise: item.mrpPaise,
          targetPricePaise: item.targetPricePaise,
          isPrescriptionRequired: item.isPrescriptionRequired || false,
          isService: item.isService || false,
          status: 'ACTIVE',
          environment: 'DEMO'
        },
        create: {
          sku: item.sku,
          name: item.name,
          slug: item.slug,
          brand: item.brand,
          shortDescription: item.shortDescription,
          description: item.description,
          categoryName: item.categoryName,
          department: item.department,
          unit: item.unit,
          packageSize: item.packageSize,
          imageUrl: item.imageUrl,
          mrpPaise: item.mrpPaise,
          targetPricePaise: item.targetPricePaise,
          isPrescriptionRequired: item.isPrescriptionRequired || false,
          isService: item.isService || false,
          status: 'ACTIVE',
          environment: 'DEMO'
        }
      });
      upsertedCount++;
    }

    // Relink demo offers to the 10 demo stores
    const demoStores = await prisma.store.findMany({
      where: { owner: { email: { contains: 'demo.' } } }
    });

    const allDemoProducts = await prisma.catalogueProduct.findMany({
      where: { environment: 'DEMO' }
    });

    let offersCreated = 0;
    for (const prod of allDemoProducts) {
      // Find matching store by department / category
      let store = demoStores.find(s => s.category === prod.department || s.category.toLowerCase().includes(prod.department?.toLowerCase() || ''));
      if (!store && demoStores.length > 0) {
        store = demoStores[0];
      }

      if (store) {
        await prisma.product.create({
          data: {
            storeId: store.id,
            catalogueProductId: prod.id,
            name: prod.name,
            brand: prod.brand,
            description: prod.description || prod.shortDescription || `${prod.name} (${prod.packageSize || prod.unit})`,
            category: prod.categoryName,
            categoryId: prod.categoryId,
            subcategoryId: prod.subcategoryId,
            pricePaise: prod.targetPricePaise || prod.mrpPaise,
            mrpPaise: prod.mrpPaise,
            stock: prod.isService ? 999 : 50,
            packageSize: prod.packageSize || prod.unit,
            imageUrl: prod.imageUrl,
            isAvailable: true,
            environment: 'DEMO'
          }
        });
        offersCreated++;
      }
    }

    // Audit log
    await prisma.catalogueAuditLog.create({
      data: {
        actorId: user?.userId || user?.id,
        actorEmail: user?.email,
        action: 'RESET_DEMO',
        entityType: 'ENVIRONMENT',
        entityId: 'DEMO',
        environment: 'DEMO',
        detailsJson: JSON.stringify({
          upsertedProducts: upsertedCount,
          recreatedOffers: offersCreated,
          timestamp: new Date().toISOString()
        })
      }
    });

    res.json({
      success: true,
      message: `Demo environment successfully reset to 500 catalogue items with ${offersCreated} active merchant offers.`,
      catalogueProductsCount: upsertedCount,
      activeOffersCount: offersCreated
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to reset demo catalogue', message: error.message });
  }
});

// 8. POST CSV Bulk Import
router.post('/import', async (req: Request, res: Response): Promise<void> => {
  const importSchema = z.object({
    environment: z.enum(['DEMO', 'LIVE']).default('DEMO'),
    csvText: z.string().min(10)
  });

  try {
    const { environment, csvText } = importSchema.parse(req.body);
    const user = (req as any).user;

    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
      res.status(400).json({ error: 'CSV must contain at least a header row and one data row' });
      return;
    }

    const header = lines[0].split(',').map(h => h.trim().toLowerCase());
    const requiredCols = ['sku', 'name', 'category', 'mrp'];
    const missing = requiredCols.filter(col => !header.some(h => h.includes(col)));
    if (missing.length > 0) {
      res.status(400).json({
        error: `CSV missing required columns: ${missing.join(', ')}`,
        expectedHeader: 'SKU, Name, Category, Brand, MRP, Target Price, Unit, Image URL'
      });
      return;
    }

    const skuIdx = header.findIndex(h => h.includes('sku'));
    const nameIdx = header.findIndex(h => h.includes('name'));
    const catIdx = header.findIndex(h => h.includes('category'));
    const brandIdx = header.findIndex(h => h.includes('brand'));
    const mrpIdx = header.findIndex(h => h.includes('mrp'));
    const targetIdx = header.findIndex(h => h.includes('target') || h.includes('price'));
    const unitIdx = header.findIndex(h => h.includes('unit'));
    const imgIdx = header.findIndex(h => h.includes('image'));

    let imported = 0;
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const parts = line.split(',').map(p => p.trim());
      const sku = parts[skuIdx];
      const name = parts[nameIdx];
      const categoryName = parts[catIdx];
      const brand = brandIdx >= 0 ? parts[brandIdx] : '';
      const mrpVal = parseFloat(parts[mrpIdx] || '0');
      const targetVal = targetIdx >= 0 ? parseFloat(parts[targetIdx] || '0') : mrpVal * 0.9;
      const unit = unitIdx >= 0 && parts[unitIdx] ? parts[unitIdx] : 'piece';
      const rawImg = imgIdx >= 0 ? parts[imgIdx] : '';

      if (!sku || !name || isNaN(mrpVal) || mrpVal <= 0) {
        errors.push(`Row ${i + 1}: Invalid SKU, Name, or MRP`);
        continue;
      }

      const mrpPaise = Math.round(mrpVal * 100);
      const targetPricePaise = Math.round(targetVal * 100);
      const resolvedImg = resolveProductImage(name, categoryName, rawImg);
      const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${sku.toLowerCase()}`;

      await prisma.catalogueProduct.upsert({
        where: { sku },
        update: {
          name,
          brand: brand || null,
          categoryName,
          mrpPaise,
          targetPricePaise,
          unit,
          imageUrl: resolvedImg,
          environment
        },
        create: {
          sku,
          name,
          slug,
          brand: brand || null,
          categoryName,
          mrpPaise,
          targetPricePaise,
          unit,
          imageUrl: resolvedImg,
          environment,
          status: 'ACTIVE'
        }
      });
      imported++;
    }

    await prisma.catalogueAuditLog.create({
      data: {
        actorId: user?.userId || user?.id,
        actorEmail: user?.email,
        action: 'BULK_IMPORT',
        entityType: 'IMPORT',
        environment,
        detailsJson: JSON.stringify({ importedCount: imported, errorsCount: errors.length })
      }
    });

    res.json({
      success: true,
      importedCount: imported,
      errorsCount: errors.length,
      errors: errors.slice(0, 10)
    });
  } catch (error: any) {
    res.status(400).json({ error: 'Failed to import CSV', message: error.message });
  }
});

// 9. GET CSV Export
router.get('/export', async (req: Request, res: Response): Promise<void> => {
  try {
    const environment = (req.query.environment as string) || 'DEMO';
    const products = await prisma.catalogueProduct.findMany({
      where: { environment },
      orderBy: [{ department: 'asc' }, { sku: 'asc' }]
    });

    const headers = ['SKU', 'Name', 'Brand', 'Category', 'Department', 'Unit', 'Package Size', 'MRP (INR)', 'Target Price (INR)', 'Image URL', 'Prescription Required', 'Service', 'Status'];
    const rows = products.map(p => [
      `"${p.sku}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${(p.brand || '').replace(/"/g, '""')}"`,
      `"${p.categoryName}"`,
      `"${p.department || ''}"`,
      `"${p.unit}"`,
      `"${p.packageSize || ''}"`,
      (p.mrpPaise / 100).toFixed(2),
      ((p.targetPricePaise || p.mrpPaise) / 100).toFixed(2),
      `"${p.imageUrl}"`,
      p.isPrescriptionRequired ? 'YES' : 'NO',
      p.isService ? 'YES' : 'NO',
      p.status
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="everybazaar-catalogue-${environment.toLowerCase()}.csv"`);
    res.send(csvContent);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to export catalogue', message: error.message });
  }
});

// 10. GET Audit Logs
router.get('/audit-logs', async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit as string || '50', 10)));
    const action = req.query.action as string | undefined;
    const environment = req.query.environment as string | undefined;

    const where: any = {};
    if (action) where.action = action;
    if (environment) where.environment = environment;

    const logs = await prisma.catalogueAuditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    res.json({ logs });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch audit logs', message: error.message });
  }
});

// 11. GET Analytics & Image Coverage
router.get('/analytics', async (req: Request, res: Response): Promise<void> => {
  try {
    const environment = (req.query.environment as string) || 'DEMO';

    const products = await prisma.catalogueProduct.findMany({
      where: { environment },
      select: {
        id: true,
        categoryName: true,
        department: true,
        imageUrl: true,
        mrpPaise: true,
        isService: true,
        isPrescriptionRequired: true
      }
    });

    const categoryDistribution: Record<string, number> = {};
    let customImageCount = 0;
    let placeholderCount = 0;
    let totalMrpPaise = 0;

    for (const p of products) {
      categoryDistribution[p.categoryName] = (categoryDistribution[p.categoryName] || 0) + 1;
      totalMrpPaise += p.mrpPaise;

      if (p.imageUrl.includes('/placeholders/') || p.imageUrl.includes('placeholder.svg')) {
        placeholderCount++;
      } else {
        customImageCount++;
      }
    }

    const total = products.length;
    res.json({
      environment,
      totalProducts: total,
      averageMrpRupees: total > 0 ? (totalMrpPaise / total / 100).toFixed(2) : '0',
      mediaCoverage: {
        customPhotographs: customImageCount,
        brandedPlaceholders: placeholderCount,
        photographCoveragePercentage: total > 0 ? Math.round((customImageCount / total) * 100) : 0
      },
      categoryDistribution
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch catalogue analytics', message: error.message });
  }
});

// 12. GET Merchant Product Requests
router.get('/merchant-requests', async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;
    const environment = (req.query.environment as string) || 'DEMO';

    const where: any = { environment };
    if (status) where.status = status;

    const requests = await prisma.merchantProductRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    res.json({ requests });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch merchant requests', message: error.message });
  }
});

// 13. POST Moderate Merchant Product Request (Approve / Reject)
router.post('/merchant-requests/:id/moderate', async (req: Request, res: Response): Promise<void> => {
  const modSchema = z.object({
    status: z.enum(['APPROVED', 'REJECTED']),
    rejectionReason: z.string().optional(),
    adminNotes: z.string().optional(),
    targetPricePaise: z.number().int().positive().optional()
  });

  try {
    const id = req.params.id;
    const { status, rejectionReason, adminNotes, targetPricePaise } = modSchema.parse(req.body);
    const user = (req as any).user;

    const request = await prisma.merchantProductRequest.findUnique({ where: { id } });
    if (!request) {
      res.status(404).json({ error: 'Merchant request not found' });
      return;
    }

    let createdCatalogueProductId: string | undefined = undefined;

    if (status === 'APPROVED') {
      // Create master CatalogueProduct
      const sku = `EB-REQ-${Date.now().toString(36).toUpperCase()}`;
      const slug = `${request.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${sku.toLowerCase()}`;
      const resolvedImg = resolveProductImage(request.name, request.categoryName, request.imageUrl);

      const catProd = await prisma.catalogueProduct.create({
        data: {
          sku,
          name: request.name,
          slug,
          brand: request.brand,
          categoryName: request.categoryName,
          categoryId: request.categoryId,
          subcategoryId: request.subcategoryId,
          unit: request.unit || 'piece',
          imageUrl: resolvedImg,
          mrpPaise: request.proposedMrpPaise || request.proposedPricePaise || 10000,
          targetPricePaise: targetPricePaise || request.proposedPricePaise || 9000,
          status: 'ACTIVE',
          environment: request.environment
        }
      });
      createdCatalogueProductId = catProd.id;

      // Automatically create the merchant's store offer
      await prisma.product.create({
        data: {
          storeId: request.storeId,
          catalogueProductId: catProd.id,
          name: catProd.name,
          brand: catProd.brand,
          description: request.description || catProd.name,
          category: catProd.categoryName,
          categoryId: catProd.categoryId,
          subcategoryId: catProd.subcategoryId,
          pricePaise: request.proposedPricePaise || catProd.targetPricePaise || catProd.mrpPaise,
          mrpPaise: catProd.mrpPaise,
          stock: 20,
          packageSize: catProd.packageSize || catProd.unit,
          imageUrl: catProd.imageUrl,
          isAvailable: true,
          environment: request.environment
        }
      });
    }

    const updated = await prisma.merchantProductRequest.update({
      where: { id },
      data: {
        status,
        rejectionReason: rejectionReason || null,
        adminNotes: adminNotes || null,
        catalogueProductId: createdCatalogueProductId || request.catalogueProductId
      }
    });

    await prisma.catalogueAuditLog.create({
      data: {
        actorId: user?.userId || user?.id,
        actorEmail: user?.email,
        action: 'APPROVE_PRODUCT',
        entityType: 'CATALOGUE_PRODUCT',
        entityId: createdCatalogueProductId || id,
        environment: request.environment,
        detailsJson: JSON.stringify({ requestId: id, status, storeId: request.storeId })
      }
    });

    res.json({ success: true, request: updated });
  } catch (error: any) {
    res.status(400).json({ error: 'Failed to moderate merchant request', message: error.message });
  }
});

export default router;
