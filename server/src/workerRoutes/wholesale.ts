import { Hono } from 'hono';
import { authMiddleware, Bindings, Variables } from '../worker';

export const wholesaleRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Helper: Calculate applicable tier price server-side
export function resolveWholesaleTierPrice(
  basePricePaise: number,
  tiers: Array<{ minQty: number; maxQty: number | null; pricePaise: number }>,
  quantity: number
): { unitPricePaise: number; appliedTier: { minQty: number; maxQty: number | null; pricePaise: number } | null } {
  if (!tiers || tiers.length === 0) {
    return { unitPricePaise: basePricePaise, appliedTier: null };
  }
  const sorted = [...tiers].sort((a, b) => b.minQty - a.minQty);
  for (const t of sorted) {
    if (quantity >= t.minQty && (t.maxQty === null || t.maxQty === undefined || quantity <= t.maxQty)) {
      return { unitPricePaise: t.pricePaise, appliedTier: t };
    }
  }
  return { unitPricePaise: basePricePaise, appliedTier: null };
}

export function parseTaxRatePct(taxClassification?: string | null): number {
  if (!taxClassification) return 5;
  const match = taxClassification.match(/(\d+)/);
  if (match) return Number(match[1]);
  if (taxClassification === 'EXEMPT') return 0;
  return 5;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// ============================================================================
// 1. PUBLIC & BUYER DISCOVERY ENDPOINTS
// ============================================================================

// GET /api/wholesale/categories
wholesaleRouter.get('/categories', async (c) => {
  const prisma = c.get('prisma');
  try {
    const categories = await prisma.wholesaleCategory.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        children: {
          where: { isActive: true },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
        }
      }
    });
    return c.json({ categories });
  } catch (err: any) {
    return c.json({ error: 'Failed to load wholesale categories', message: err.message }, 500);
  }
});

// GET /api/wholesale/products
wholesaleRouter.get('/products', async (c) => {
  const prisma = c.get('prisma');
  const q = (c.req.query('q') || '').trim().toLowerCase();
  const categoryId = c.req.query('categoryId');
  const listingType = c.req.query('listingType');
  const wholesalerId = c.req.query('wholesalerId');
  const sort = c.req.query('sort') || 'newest';

  try {
    const where: any = {
      status: 'ACTIVE',
      approvalStatus: 'APPROVED',
      wholesaler: {
        verificationStatus: 'APPROVED'
      }
    };
    if (categoryId) {
      where.OR = [{ categoryId }, { subcategoryId: categoryId }];
    }
    if (listingType) {
      where.listingType = listingType;
    }
    if (wholesalerId) {
      where.wholesalerId = wholesalerId;
    }

    const products = await prisma.wholesaleProduct.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        subcategory: { select: { id: true, name: true, slug: true } },
        wholesaler: {
          select: {
            id: true,
            businessName: true,
            slug: true,
            businessType: true,
            city: true,
            state: true,
            isVerified: true
          }
        },
        priceTiers: { orderBy: { minQty: 'asc' } },
        inventories: true
      },
      orderBy: sort === 'price_asc' ? { basePricePaise: 'asc' } : sort === 'moq_asc' ? { moq: 'asc' } : { createdAt: 'desc' },
      take: 100
    });

    const filtered = q
      ? products.filter((p: any) =>
          p.title.toLowerCase().includes(q) ||
          (p.brand && p.brand.toLowerCase().includes(q)) ||
          p.sku.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
        )
      : products;

    return c.json({ products: filtered });
  } catch (err: any) {
    return c.json({ error: 'Failed to load wholesale products', message: err.message }, 500);
  }
});

// GET /api/wholesale/products/:idOrSlug
wholesaleRouter.get('/products/:idOrSlug', async (c) => {
  const prisma = c.get('prisma');
  const idOrSlug = c.req.param('idOrSlug');

  try {
    const product = await prisma.wholesaleProduct.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }]
      },
      include: {
        category: true,
        subcategory: true,
        warehouse: true,
        wholesaler: {
          select: {
            id: true,
            businessName: true,
            legalBusinessName: true,
            slug: true,
            businessType: true,
            city: true,
            state: true,
            isVerified: true,
            verificationStatus: true,
            serviceableRegions: true,
            paymentPreferences: true
          }
        },
        priceTiers: { orderBy: { minQty: 'asc' } },
        inventories: true
      }
    });

    if (!product) {
      return c.json({ error: 'Wholesale product not found' }, 404);
    }

    return c.json({ product });
  } catch (err: any) {
    return c.json({ error: 'Failed to fetch wholesale product', message: err.message }, 500);
  }
});

// GET /api/wholesale/wholesalers
wholesaleRouter.get('/wholesalers', async (c) => {
  const prisma = c.get('prisma');
  try {
    const wholesalers = await prisma.wholesalerProfile.findMany({
      where: { verificationStatus: 'APPROVED' },
      select: {
        id: true,
        businessName: true,
        slug: true,
        businessType: true,
        city: true,
        state: true,
        isVerified: true,
        serviceableRegions: true,
        _count: { select: { products: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 30
    });
    return c.json({ wholesalers });
  } catch (err: any) {
    return c.json({ error: 'Failed to load wholesalers', message: err.message }, 500);
  }
});

// ============================================================================
// 2. WHOLESALER ONBOARDING & PROFILE
// ============================================================================

// POST /api/wholesale/onboarding/register
wholesaleRouter.post('/onboarding/register', authMiddleware, async (c) => {
  const prisma = c.get('prisma');
  const user = c.get('user')!;
  const userId = user.userId || user.id;

  try {
    const body = await c.req.json();
    const {
      businessName,
      legalBusinessName,
      businessType = 'WHOLESALER',
      hasGst = false,
      gstin,
      panNumber,
      businessAddress,
      city = 'Indore',
      state = 'Madhya Pradesh',
      pincode,
      contactName,
      contactPhone,
      contactEmail,
      serviceableRegions = [],
      paymentPreferences = ['UPI', 'BANK_TRANSFER'],
      documentsJson = []
    } = body;

    if (!businessName || !legalBusinessName || !businessAddress || !pincode || !contactName || !contactPhone) {
      return c.json({ error: 'Required business and contact details are missing' }, 400);
    }

    if (hasGst && !gstin) {
      return c.json({ error: 'GSTIN is required when GST registration is selected' }, 400);
    }

    const existing = await prisma.wholesalerProfile.findUnique({ where: { userId } });
    if (existing) {
      return c.json({ error: 'Wholesaler profile already exists for this account', profile: existing }, 409);
    }

    const slug = `${slugify(businessName)}-${Math.random().toString(36).slice(2, 6)}`;

    const profile = await prisma.wholesalerProfile.create({
      data: {
        userId,
        businessName,
        legalBusinessName,
        slug,
        businessType,
        hasGst: Boolean(hasGst),
        gstin: hasGst ? gstin : null,
        panNumber: panNumber || null,
        businessAddress,
        city,
        state,
        pincode,
        contactName,
        contactPhone,
        contactEmail: contactEmail || user.email,
        serviceableRegions: JSON.stringify(Array.isArray(serviceableRegions) ? serviceableRegions : []),
        paymentPreferences: JSON.stringify(Array.isArray(paymentPreferences) ? paymentPreferences : []),
        documentsJson: JSON.stringify(Array.isArray(documentsJson) ? documentsJson : []),
        verificationStatus: 'PENDING',
        isVerified: false
      }
    });

    // Create default warehouse
    await prisma.wholesaleWarehouse.create({
      data: {
        wholesalerId: profile.id,
        name: `${businessName} Main Warehouse`,
        addressLine: businessAddress,
        city,
        state,
        pincode,
        contactPhone,
        isDefault: true,
        isActive: true
      }
    });

    // Upgrade role to WHOLESALER if currently CUSTOMER (never downgrade ADMIN)
    if (user.role === 'CUSTOMER') {
      await prisma.user.update({
        where: { id: userId },
        data: { role: 'WHOLESALER' }
      });
    }

    return c.json({ message: 'Wholesaler application submitted for verification', profile }, 201);
  } catch (err: any) {
    return c.json({ error: 'Failed to submit wholesaler application', message: err.message }, 500);
  }
});

// Helper: Resolve authenticated wholesaler profile
async function getWholesalerForUser(prisma: any, user: any) {
  const userId = user.userId || user.id;
  return prisma.wholesalerProfile.findUnique({
    where: { userId },
    include: { warehouses: true }
  });
}

// GET /api/wholesale/profile
wholesaleRouter.get('/profile', authMiddleware, async (c) => {
  const prisma = c.get('prisma');
  const user = c.get('user')!;
  try {
    const profile = await getWholesalerForUser(prisma, user);
    if (!profile) {
      return c.json({ error: 'No wholesaler profile found for this account' }, 404);
    }
    return c.json({ profile });
  } catch (err: any) {
    return c.json({ error: 'Failed to load wholesaler profile', message: err.message }, 500);
  }
});

// PUT /api/wholesale/profile
wholesaleRouter.put('/profile', authMiddleware, async (c) => {
  const prisma = c.get('prisma');
  const user = c.get('user')!;
  try {
    const profile = await getWholesalerForUser(prisma, user);
    if (!profile) {
      return c.json({ error: 'Wholesaler profile not found' }, 404);
    }
    const body = await c.req.json();
    const updated = await prisma.wholesalerProfile.update({
      where: { id: profile.id },
      data: {
        businessName: body.businessName ?? profile.businessName,
        legalBusinessName: body.legalBusinessName ?? profile.legalBusinessName,
        businessType: body.businessType ?? profile.businessType,
        hasGst: body.hasGst !== undefined ? Boolean(body.hasGst) : profile.hasGst,
        gstin: body.gstin !== undefined ? body.gstin : profile.gstin,
        panNumber: body.panNumber !== undefined ? body.panNumber : profile.panNumber,
        businessAddress: body.businessAddress ?? profile.businessAddress,
        city: body.city ?? profile.city,
        state: body.state ?? profile.state,
        pincode: body.pincode ?? profile.pincode,
        contactName: body.contactName ?? profile.contactName,
        contactPhone: body.contactPhone ?? profile.contactPhone,
        contactEmail: body.contactEmail ?? profile.contactEmail,
        serviceableRegions: body.serviceableRegions ? JSON.stringify(body.serviceableRegions) : profile.serviceableRegions,
        paymentPreferences: body.paymentPreferences ? JSON.stringify(body.paymentPreferences) : profile.paymentPreferences,
        documentsJson: body.documentsJson ? JSON.stringify(body.documentsJson) : profile.documentsJson
      }
    });
    return c.json({ profile: updated });
  } catch (err: any) {
    return c.json({ error: 'Failed to update profile', message: err.message }, 500);
  }
});

// POST /api/wholesale/warehouses
wholesaleRouter.post('/warehouses', authMiddleware, async (c) => {
  const prisma = c.get('prisma');
  const user = c.get('user')!;
  try {
    const profile = await getWholesalerForUser(prisma, user);
    if (!profile) return c.json({ error: 'Wholesaler profile required' }, 403);

    const body = await c.req.json();
    if (!body.name || !body.addressLine || !body.city || !body.state || !body.pincode) {
      return c.json({ error: 'Complete warehouse address fields are required' }, 400);
    }

    const warehouse = await prisma.wholesaleWarehouse.create({
      data: {
        wholesalerId: profile.id,
        name: body.name,
        addressLine: body.addressLine,
        city: body.city,
        state: body.state,
        pincode: body.pincode,
        contactPhone: body.contactPhone || profile.contactPhone,
        isDefault: Boolean(body.isDefault),
        isActive: true
      }
    });
    return c.json({ warehouse }, 201);
  } catch (err: any) {
    return c.json({ error: 'Failed to add warehouse', message: err.message }, 500);
  }
});

// ============================================================================
// 3. WHOLESALER CONSOLE (TENANT-ISOLATED)
// ============================================================================

// GET /api/wholesale/console/overview
wholesaleRouter.get('/console/overview', authMiddleware, async (c) => {
  const prisma = c.get('prisma');
  const user = c.get('user')!;
  try {
    const profile = await getWholesalerForUser(prisma, user);
    if (!profile) {
      return c.json({ error: 'Wholesaler profile not found' }, 404);
    }

    const [products, orders, rfqs, quotations] = await Promise.all([
      prisma.wholesaleProduct.findMany({
        where: { wholesalerId: profile.id },
        include: { inventories: true, priceTiers: { orderBy: { minQty: 'asc' } }, category: true }
      }),
      prisma.wholesaleOrder.findMany({
        where: { wholesalerId: profile.id },
        include: {
          items: true,
          shipments: true,
          buyer: { select: { id: true, name: true, email: true, phone: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.wholesaleQuotationRequest.findMany({
        where: { wholesalerId: profile.id },
        include: {
          product: { select: { id: true, title: true, mainImageUrl: true, unitOfMeasurement: true, moq: true } },
          buyer: { select: { id: true, name: true, email: true, phone: true } },
          quotations: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.wholesaleQuotation.findMany({
        where: { wholesalerId: profile.id },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    const nonCancelledOrders = orders.filter((o: any) => o.status !== 'CANCELLED' && o.status !== 'REFUNDED');
    const totalGmvPaise = nonCancelledOrders.reduce((s: number, o: any) => s + o.totalPaise, 0);
    const paidOrders = orders.filter((o: any) => o.paymentStatus === 'PAID' || o.status === 'DELIVERED');
    const revenuePaise = paidOrders.reduce((s: number, o: any) => s + o.totalPaise, 0);
    const pendingOrdersCount = orders.filter((o: any) =>
      ['PENDING_PAYMENT', 'PAID', 'CONFIRMED', 'PROCESSING', 'READY_TO_DISPATCH'].includes(o.status)
    ).length;
    const lowStockCount = products.filter((p: any) => {
      const totalAvail = (p.inventories || []).reduce((s: number, inv: any) => s + inv.availableQty, 0);
      const threshold = p.inventories?.[0]?.lowStockThreshold ?? 20;
      return totalAvail <= threshold;
    }).length;
    const pendingRfqsCount = rfqs.filter((r: any) => r.status === 'OPEN').length;
    const acceptedQuotationsCount = quotations.filter((q: any) => q.status === 'ACCEPTED' || q.status === 'CONVERTED').length;
    const averageOrderValuePaise = nonCancelledOrders.length > 0 ? Math.round(totalGmvPaise / nonCancelledOrders.length) : 0;

    return c.json({
      profile,
      metrics: {
        totalOrders: orders.length,
        totalGmvPaise,
        revenuePaise,
        pendingOrders: pendingOrdersCount,
        productsListed: products.length,
        lowStock: lowStockCount,
        pendingRfqs: pendingRfqsCount,
        acceptedQuotations: acceptedQuotationsCount,
        averageOrderValuePaise
      },
      products,
      orders,
      rfqs,
      quotations
    });
  } catch (err: any) {
    return c.json({ error: 'Failed to load wholesaler console', message: err.message }, 500);
  }
});

// POST /api/wholesale/console/products
wholesaleRouter.post('/console/products', authMiddleware, async (c) => {
  const prisma = c.get('prisma');
  const user = c.get('user')!;
  try {
    const profile = await getWholesalerForUser(prisma, user);
    if (!profile) return c.json({ error: 'Wholesaler profile required' }, 403);
    if (profile.verificationStatus !== 'APPROVED' && user.role !== 'ADMIN') {
      return c.json({ error: 'Your wholesaler account must be approved by Super Admin before publishing products' }, 403);
    }

    const body = await c.req.json();
    const {
      categoryId,
      subcategoryId,
      warehouseId,
      title,
      brand,
      description,
      mainImageUrl,
      galleryImages = [],
      specifications = {},
      sku,
      hsnCode,
      unitOfMeasurement = 'pieces',
      packageSize,
      moq,
      basePricePaise,
      listingType = 'TIERED',
      dispatchTime = '24-48 Hours',
      shippingRegions = [],
      taxClassification = 'GST_5',
      priceTiers = [],
      initialStock = 100
    } = body;

    if (!categoryId || !title || !description || !sku || !moq || Number(moq) < 1 || !basePricePaise || Number(basePricePaise) <= 0) {
      return c.json({ error: 'Title, category, SKU, MOQ (>= 1), and valid base price are required' }, 400);
    }

    const slug = `${slugify(title)}-${Math.random().toString(36).slice(2, 6)}`;
    const targetWarehouseId = warehouseId || profile.warehouses?.[0]?.id || null;

    const product = await prisma.wholesaleProduct.create({
      data: {
        wholesalerId: profile.id,
        categoryId,
        subcategoryId: subcategoryId || null,
        warehouseId: targetWarehouseId,
        title,
        slug,
        brand: brand || null,
        description,
        mainImageUrl: mainImageUrl || '/brand/product-placeholder.svg',
        galleryImagesJson: JSON.stringify(galleryImages),
        specificationsJson: JSON.stringify(specifications),
        sku,
        hsnCode: hsnCode || null,
        unitOfMeasurement,
        packageSize: packageSize || null,
        moq: Number(moq),
        basePricePaise: Math.round(Number(basePricePaise)),
        listingType,
        dispatchTime,
        shippingRegionsJson: JSON.stringify(shippingRegions),
        taxClassification,
        status: 'ACTIVE',
        approvalStatus: user.role === 'ADMIN' ? 'APPROVED' : 'PENDING'
      }
    });

    if (Array.isArray(priceTiers) && priceTiers.length > 0) {
      for (const t of priceTiers) {
        if (Number(t.minQty) >= 1 && Number(t.pricePaise) > 0) {
          await prisma.wholesalePriceTier.create({
            data: {
              productId: product.id,
              minQty: Number(t.minQty),
              maxQty: t.maxQty ? Number(t.maxQty) : null,
              pricePaise: Math.round(Number(t.pricePaise))
            }
          });
        }
      }
    }

    await prisma.wholesaleInventory.create({
      data: {
        productId: product.id,
        warehouseId: targetWarehouseId,
        availableQty: Math.max(0, Number(initialStock)),
        reservedQty: 0,
        lowStockThreshold: Math.max(Number(moq) * 2, 20)
      }
    });

    return c.json({ message: 'Wholesale product created', product }, 201);
  } catch (err: any) {
    return c.json({ error: 'Failed to create wholesale product', message: err.message }, 500);
  }
});

// PATCH /api/wholesale/console/products/:id/inventory
wholesaleRouter.patch('/console/products/:id/inventory', authMiddleware, async (c) => {
  const prisma = c.get('prisma');
  const user = c.get('user')!;
  const productId = c.req.param('id');

  try {
    const profile = await getWholesalerForUser(prisma, user);
    if (!profile) return c.json({ error: 'Wholesaler profile required' }, 403);

    const product = await prisma.wholesaleProduct.findFirst({
      where: { id: productId, wholesalerId: profile.id }
    });
    if (!product) return c.json({ error: 'Product not found or unauthorized' }, 404);

    const { availableQty, lowStockThreshold } = await c.req.json();
    const existingInv = await prisma.wholesaleInventory.findFirst({ where: { productId } });
    if (existingInv) {
      const updated = await prisma.wholesaleInventory.update({
        where: { id: existingInv.id },
        data: {
          availableQty: availableQty !== undefined ? Math.max(0, Number(availableQty)) : existingInv.availableQty,
          lowStockThreshold: lowStockThreshold !== undefined ? Math.max(1, Number(lowStockThreshold)) : existingInv.lowStockThreshold
        }
      });
      return c.json({ inventory: updated });
    }
    const created = await prisma.wholesaleInventory.create({
      data: {
        productId,
        warehouseId: product.warehouseId,
        availableQty: Math.max(0, Number(availableQty || 0)),
        lowStockThreshold: Math.max(1, Number(lowStockThreshold || 20))
      }
    });
    return c.json({ inventory: created });
  } catch (err: any) {
    return c.json({ error: 'Failed to update inventory', message: err.message }, 500);
  }
});

// PATCH /api/wholesale/console/orders/:id/status
wholesaleRouter.patch('/console/orders/:id/status', authMiddleware, async (c) => {
  const prisma = c.get('prisma');
  const user = c.get('user')!;
  const orderId = c.req.param('id');

  try {
    const profile = await getWholesalerForUser(prisma, user);
    if (!profile && user.role !== 'ADMIN') return c.json({ error: 'Wholesaler profile required' }, 403);

    const order = await prisma.wholesaleOrder.findFirst({
      where: user.role === 'ADMIN' ? { id: orderId } : { id: orderId, wholesalerId: profile.id }
    });
    if (!order) return c.json({ error: 'Wholesale order not found' }, 404);

    const { status, carrierName, trackingNumber, lrNumber, vehicleDetails, fulfillmentMethod, note } = await c.req.json();
    const allowedStatuses = [
      'PENDING_PAYMENT', 'PAID', 'CONFIRMED', 'PROCESSING', 'READY_TO_DISPATCH',
      'DISPATCHED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'REFUNDED', 'DISPUTED'
    ];
    if (!allowedStatuses.includes(status)) {
      return c.json({ error: 'Invalid wholesale order status' }, 400);
    }

    const history = JSON.parse(order.auditHistoryJson || '[]');
    history.push({
      fromStatus: order.status,
      toStatus: status,
      actorId: user.userId || user.id,
      note: note || '',
      timestamp: new Date().toISOString()
    });

    const updated = await prisma.wholesaleOrder.update({
      where: { id: order.id },
      data: {
        status,
        fulfillmentMethod: fulfillmentMethod || order.fulfillmentMethod,
        paymentStatus: status === 'PAID' ? 'PAID' : status === 'REFUNDED' ? 'REFUNDED' : order.paymentStatus,
        auditHistoryJson: JSON.stringify(history)
      }
    });

    if (['DISPATCHED', 'IN_TRANSIT', 'DELIVERED'].includes(status)) {
      const existingShip = await prisma.wholesaleShipment.findFirst({ where: { orderId: order.id } });
      if (existingShip) {
        await prisma.wholesaleShipment.update({
          where: { id: existingShip.id },
          data: {
            status: status === 'DELIVERED' ? 'DELIVERED' : status === 'IN_TRANSIT' ? 'IN_TRANSIT' : 'DISPATCHED',
            carrierName: carrierName ?? existingShip.carrierName,
            trackingNumber: trackingNumber ?? existingShip.trackingNumber,
            lrNumber: lrNumber ?? existingShip.lrNumber,
            vehicleDetails: vehicleDetails ?? existingShip.vehicleDetails,
            deliveredAt: status === 'DELIVERED' ? new Date() : existingShip.deliveredAt
          }
        });
      } else {
        await prisma.wholesaleShipment.create({
          data: {
            orderId: order.id,
            fulfillmentMethod: fulfillmentMethod || order.fulfillmentMethod,
            carrierName: carrierName || null,
            trackingNumber: trackingNumber || null,
            lrNumber: lrNumber || null,
            vehicleDetails: vehicleDetails || null,
            dispatchedAt: new Date(),
            status: status === 'DELIVERED' ? 'DELIVERED' : 'DISPATCHED',
            deliveredAt: status === 'DELIVERED' ? new Date() : null
          }
        });
      }
    }

    return c.json({ order: updated });
  } catch (err: any) {
    return c.json({ error: 'Failed to update wholesale order status', message: err.message }, 500);
  }
});

// POST /api/wholesale/console/rfqs/:id/quote
wholesaleRouter.post('/console/rfqs/:id/quote', authMiddleware, async (c) => {
  const prisma = c.get('prisma');
  const user = c.get('user')!;
  const rfqId = c.req.param('id');

  try {
    const profile = await getWholesalerForUser(prisma, user);
    if (!profile) return c.json({ error: 'Wholesaler profile required' }, 403);

    const rfq = await prisma.wholesaleQuotationRequest.findFirst({
      where: { id: rfqId, wholesalerId: profile.id },
      include: { product: true }
    });
    if (!rfq) return c.json({ error: 'RFQ not found' }, 404);

    const { quotedUnitPricePaise, quotedQty, deliveryChargePaise = 0, validDays = 7, termsAndConditions, notes } = await c.req.json();
    const unitPrice = Math.round(Number(quotedUnitPricePaise));
    const qty = Number(quotedQty || rfq.requestedQty);
    const delivery = Math.round(Number(deliveryChargePaise));

    if (!unitPrice || unitPrice <= 0 || qty < 1) {
      return c.json({ error: 'Valid quoted unit price and quantity are required' }, 400);
    }

    const subtotal = unitPrice * qty;
    const taxRate = parseTaxRatePct(rfq.product?.taxClassification);
    const taxPaise = Math.round((subtotal * taxRate) / 100);
    const totalPaise = subtotal + taxPaise + delivery;
    const validUntil = new Date(Date.now() + Number(validDays) * 24 * 60 * 60 * 1000);

    const quotation = await prisma.wholesaleQuotation.create({
      data: {
        rfqId: rfq.id,
        wholesalerId: profile.id,
        quotedUnitPricePaise: unitPrice,
        quotedQty: qty,
        deliveryChargePaise: delivery,
        taxPaise,
        totalPaise,
        validUntil,
        termsAndConditions: termsAndConditions || 'Standard B2B wholesale terms apply.',
        notes: notes || null,
        status: 'SUBMITTED'
      }
    });

    await prisma.wholesaleQuotationRequest.update({
      where: { id: rfq.id },
      data: { status: 'QUOTED' }
    });

    return c.json({ quotation }, 201);
  } catch (err: any) {
    return c.json({ error: 'Failed to submit quotation', message: err.message }, 500);
  }
});

// POST /api/wholesale/console/rfqs/:id/reject
wholesaleRouter.post('/console/rfqs/:id/reject', authMiddleware, async (c) => {
  const prisma = c.get('prisma');
  const user = c.get('user')!;
  const rfqId = c.req.param('id');

  try {
    const profile = await getWholesalerForUser(prisma, user);
    if (!profile) return c.json({ error: 'Wholesaler profile required' }, 403);

    const rfq = await prisma.wholesaleQuotationRequest.findFirst({
      where: { id: rfqId, wholesalerId: profile.id }
    });
    if (!rfq) return c.json({ error: 'RFQ not found' }, 404);

    const updated = await prisma.wholesaleQuotationRequest.update({
      where: { id: rfq.id },
      data: { status: 'REJECTED' }
    });
    return c.json({ rfq: updated });
  } catch (err: any) {
    return c.json({ error: 'Failed to reject RFQ', message: err.message }, 500);
  }
});

// ============================================================================
// 4. BUYER CART, CHECKOUT, ORDERS & RFQ
// ============================================================================

// GET /api/wholesale/cart
wholesaleRouter.get('/cart', authMiddleware, async (c) => {
  const prisma = c.get('prisma');
  const user = c.get('user')!;
  const buyerId = user.userId || user.id;

  try {
    const items = await prisma.wholesaleCartItem.findMany({
      where: { buyerId },
      include: {
        product: {
          include: {
            wholesaler: { select: { id: true, businessName: true, city: true, isVerified: true } },
            priceTiers: { orderBy: { minQty: 'asc' } },
            inventories: true
          }
        }
      }
    });

    const enriched = items.map((item: any) => {
      const { unitPricePaise, appliedTier } = resolveWholesaleTierPrice(
        item.product.basePricePaise,
        item.product.priceTiers,
        item.quantity
      );
      const lineSubtotal = unitPricePaise * item.quantity;
      const taxRate = parseTaxRatePct(item.product.taxClassification);
      const lineTax = Math.round((lineSubtotal * taxRate) / 100);
      return {
        ...item,
        unitPricePaise,
        appliedTier,
        lineSubtotalPaise: lineSubtotal,
        taxRatePct: taxRate,
        lineTaxPaise: lineTax,
        lineTotalPaise: lineSubtotal + lineTax
      };
    });

    const subtotalPaise = enriched.reduce((s: number, i: any) => s + i.lineSubtotalPaise, 0);
    const taxPaise = enriched.reduce((s: number, i: any) => s + i.lineTaxPaise, 0);

    return c.json({
      items: enriched,
      summary: {
        itemCount: enriched.length,
        subtotalPaise,
        taxPaise,
        totalPaise: subtotalPaise + taxPaise
      }
    });
  } catch (err: any) {
    return c.json({ error: 'Failed to fetch wholesale cart', message: err.message }, 500);
  }
});

// POST /api/wholesale/cart/items
wholesaleRouter.post('/cart/items', authMiddleware, async (c) => {
  const prisma = c.get('prisma');
  const user = c.get('user')!;
  const buyerId = user.userId || user.id;

  try {
    const { productId, quantity } = await c.req.json();
    const qty = Number(quantity);

    const product = await prisma.wholesaleProduct.findUnique({
      where: { id: productId },
      include: { inventories: true, wholesaler: true }
    });
    if (!product || product.status !== 'ACTIVE' || product.approvalStatus !== 'APPROVED' || product.wholesaler.verificationStatus !== 'APPROVED') {
      return c.json({ error: 'Wholesale product is unavailable for purchase' }, 404);
    }

    if (!Number.isInteger(qty) || qty < product.moq) {
      return c.json({ error: `Minimum Order Quantity (MOQ) is ${product.moq} ${product.unitOfMeasurement}` }, 400);
    }

    const totalStock = (product.inventories || []).reduce((s: number, inv: any) => s + inv.availableQty, 0);
    if (qty > totalStock) {
      return c.json({ error: `Only ${totalStock} ${product.unitOfMeasurement} available in stock` }, 400);
    }

    const existing = await prisma.wholesaleCartItem.findUnique({
      where: { buyerId_productId: { buyerId, productId } }
    });

    const item = existing
      ? await prisma.wholesaleCartItem.update({
          where: { id: existing.id },
          data: { quantity: qty }
        })
      : await prisma.wholesaleCartItem.create({
          data: { buyerId, productId, quantity: qty }
        });

    return c.json({ item }, 201);
  } catch (err: any) {
    return c.json({ error: 'Failed to add to wholesale cart', message: err.message }, 500);
  }
});

// DELETE /api/wholesale/cart/items/:productId
wholesaleRouter.delete('/cart/items/:productId', authMiddleware, async (c) => {
  const prisma = c.get('prisma');
  const user = c.get('user')!;
  const buyerId = user.userId || user.id;
  const productId = c.req.param('productId');

  try {
    await prisma.wholesaleCartItem.deleteMany({ where: { buyerId, productId } });
    return c.json({ message: 'Removed from wholesale cart' });
  } catch (err: any) {
    return c.json({ error: 'Failed to remove item', message: err.message }, 500);
  }
});

// POST /api/wholesale/orders/checkout
wholesaleRouter.post('/orders/checkout', authMiddleware, async (c) => {
  const prisma = c.get('prisma');
  const user = c.get('user')!;
  const buyerId = user.userId || user.id;

  try {
    const body = await c.req.json();
    const {
      shippingAddress,
      paymentMethod = 'ONLINE',
      fulfillmentMethod = 'TRANSPORTER',
      notes
    } = body;

    if (!shippingAddress || !shippingAddress.addressLine || !shippingAddress.city || !shippingAddress.pincode) {
      return c.json({ error: 'Complete business shipping address is required' }, 400);
    }

    const cartItems = await prisma.wholesaleCartItem.findMany({
      where: { buyerId },
      include: {
        product: {
          include: {
            priceTiers: { orderBy: { minQty: 'asc' } },
            inventories: true,
            wholesaler: true
          }
        }
      }
    });

    if (cartItems.length === 0) {
      return c.json({ error: 'Your wholesale cart is empty' }, 400);
    }

    // Validate MOQ & stock across all items first
    for (const ci of cartItems) {
      if (ci.quantity < ci.product.moq) {
        return c.json({ error: `${ci.product.title} requires minimum order of ${ci.product.moq} ${ci.product.unitOfMeasurement}` }, 400);
      }
      const stock = (ci.product.inventories || []).reduce((s: number, inv: any) => s + inv.availableQty, 0);
      if (ci.quantity > stock) {
        return c.json({ error: `Insufficient stock for ${ci.product.title}. Available: ${stock}` }, 400);
      }
    }

    // Group cart items by wholesalerId
    const byWholesaler: Record<string, any[]> = {};
    for (const ci of cartItems) {
      const wid = ci.product.wholesalerId;
      if (!byWholesaler[wid]) byWholesaler[wid] = [];
      byWholesaler[wid].push(ci);
    }

    const createdOrders: any[] = [];

    for (const [wholesalerId, groupItems] of Object.entries(byWholesaler)) {
      let subtotalPaise = 0;
      let taxPaise = 0;
      const orderItemsData: any[] = [];

      for (const ci of groupItems) {
        const { unitPricePaise, appliedTier } = resolveWholesaleTierPrice(
          ci.product.basePricePaise,
          ci.product.priceTiers,
          ci.quantity
        );
        const lineSub = unitPricePaise * ci.quantity;
        const taxRate = parseTaxRatePct(ci.product.taxClassification);
        const lineTax = Math.round((lineSub * taxRate) / 100);
        subtotalPaise += lineSub;
        taxPaise += lineTax;

        orderItemsData.push({
          productId: ci.product.id,
          productTitle: ci.product.title,
          sku: ci.product.sku,
          unitOfMeasurement: ci.product.unitOfMeasurement,
          quantity: ci.quantity,
          agreedUnitPricePaise: unitPricePaise,
          tierAppliedJson: appliedTier ? JSON.stringify(appliedTier) : null,
          taxRatePct: taxRate,
          taxPaise: lineTax,
          lineTotalPaise: lineSub + lineTax
        });

        // Deduct inventory
        const inv = ci.product.inventories?.[0];
        if (inv) {
          await prisma.wholesaleInventory.update({
            where: { id: inv.id },
            data: { availableQty: Math.max(0, inv.availableQty - ci.quantity) }
          });
        }
      }

      const orderNumber = `EB-WHS-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
      const invoiceNumber = `INV-WHS-${Date.now().toString().slice(-6)}`;
      const shippingPaise = 0; // Transporter / seller-arranged freight agreed or free over bulk threshold
      const totalPaise = subtotalPaise + taxPaise + shippingPaise;

      const order = await prisma.wholesaleOrder.create({
        data: {
          orderNumber,
          buyerId,
          wholesalerId,
          status: paymentMethod === 'ONLINE' ? 'PAID' : 'PENDING_PAYMENT',
          paymentStatus: paymentMethod === 'ONLINE' ? 'PAID' : 'PENDING',
          paymentMethod,
          fulfillmentMethod,
          subtotalPaise,
          taxPaise,
          shippingPaise,
          discountPaise: 0,
          totalPaise,
          shippingAddressJson: JSON.stringify(shippingAddress),
          invoiceNumber,
          notes: notes || null,
          auditHistoryJson: JSON.stringify([
            {
              toStatus: paymentMethod === 'ONLINE' ? 'PAID' : 'PENDING_PAYMENT',
              actorId: buyerId,
              note: 'Wholesale order placed',
              timestamp: new Date().toISOString()
            }
          ]),
          items: { create: orderItemsData }
        },
        include: { items: true }
      });

      createdOrders.push(order);
    }

    // Clear wholesale cart
    await prisma.wholesaleCartItem.deleteMany({ where: { buyerId } });

    return c.json({ message: 'Wholesale order(s) placed successfully', orders: createdOrders }, 201);
  } catch (err: any) {
    return c.json({ error: 'Wholesale checkout failed', message: err.message }, 500);
  }
});

// GET /api/wholesale/orders (Buyer's own wholesale orders)
wholesaleRouter.get('/orders', authMiddleware, async (c) => {
  const prisma = c.get('prisma');
  const user = c.get('user')!;
  const buyerId = user.userId || user.id;

  try {
    const orders = await prisma.wholesaleOrder.findMany({
      where: { buyerId },
      include: {
        wholesaler: { select: { id: true, businessName: true, city: true, contactPhone: true } },
        items: true,
        shipments: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return c.json({ orders });
  } catch (err: any) {
    return c.json({ error: 'Failed to load wholesale orders', message: err.message }, 500);
  }
});

// POST /api/wholesale/rfqs (Submit RFQ)
wholesaleRouter.post('/rfqs', authMiddleware, async (c) => {
  const prisma = c.get('prisma');
  const user = c.get('user')!;
  const buyerId = user.userId || user.id;

  try {
    const { productId, requestedQty, deliveryCity, deliveryState, deliveryPincode, deliveryAddress, expectedDeliveryDate, requirements } = await c.req.json();
    const qty = Number(requestedQty);
    if (!productId || !qty || qty < 1 || !deliveryCity || !deliveryPincode || !deliveryAddress) {
      return c.json({ error: 'Product, quantity, and complete delivery details are required' }, 400);
    }

    const product = await prisma.wholesaleProduct.findUnique({ where: { id: productId } });
    if (!product) return c.json({ error: 'Wholesale product not found' }, 404);

    const rfqNumber = `RFQ-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
    const rfq = await prisma.wholesaleQuotationRequest.create({
      data: {
        rfqNumber,
        buyerId,
        wholesalerId: product.wholesalerId,
        productId: product.id,
        requestedQty: qty,
        deliveryCity,
        deliveryState: deliveryState || 'Madhya Pradesh',
        deliveryPincode,
        deliveryAddress,
        expectedDeliveryDate: expectedDeliveryDate || null,
        requirements: requirements || null,
        status: 'OPEN'
      }
    });

    return c.json({ rfq }, 201);
  } catch (err: any) {
    return c.json({ error: 'Failed to submit RFQ', message: err.message }, 500);
  }
});

// GET /api/wholesale/rfqs (Buyer's own RFQs)
wholesaleRouter.get('/rfqs', authMiddleware, async (c) => {
  const prisma = c.get('prisma');
  const user = c.get('user')!;
  const buyerId = user.userId || user.id;

  try {
    const rfqs = await prisma.wholesaleQuotationRequest.findMany({
      where: { buyerId },
      include: {
        product: { select: { id: true, title: true, mainImageUrl: true, unitOfMeasurement: true, moq: true } },
        wholesaler: { select: { id: true, businessName: true, city: true, isVerified: true } },
        quotations: { orderBy: { createdAt: 'desc' } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return c.json({ rfqs });
  } catch (err: any) {
    return c.json({ error: 'Failed to load RFQs', message: err.message }, 500);
  }
});

// POST /api/wholesale/quotations/:id/accept (Accept quotation and convert into WholesaleOrder)
wholesaleRouter.post('/quotations/:id/accept', authMiddleware, async (c) => {
  const prisma = c.get('prisma');
  const user = c.get('user')!;
  const buyerId = user.userId || user.id;
  const quotationId = c.req.param('id');

  try {
    const quotation = await prisma.wholesaleQuotation.findUnique({
      where: { id: quotationId },
      include: {
        rfq: {
          include: {
            product: true
          }
        }
      }
    });

    if (!quotation || quotation.rfq.buyerId !== buyerId) {
      return c.json({ error: 'Quotation not found or unauthorized' }, 404);
    }

    if (quotation.status !== 'SUBMITTED') {
      return c.json({ error: 'Quotation is no longer available to accept' }, 400);
    }

    const rfq = quotation.rfq;
    const subtotalPaise = quotation.quotedUnitPricePaise * quotation.quotedQty;
    const orderNumber = `EB-WHS-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
    const invoiceNumber = `INV-WHS-${Date.now().toString().slice(-6)}`;

    const order = await prisma.wholesaleOrder.create({
      data: {
        orderNumber,
        buyerId,
        wholesalerId: quotation.wholesalerId,
        quotationId: quotation.id,
        status: 'CONFIRMED',
        paymentStatus: 'PENDING',
        paymentMethod: 'BANK_TRANSFER',
        fulfillmentMethod: 'TRANSPORTER',
        subtotalPaise,
        taxPaise: quotation.taxPaise,
        shippingPaise: quotation.deliveryChargePaise,
        discountPaise: 0,
        totalPaise: quotation.totalPaise,
        shippingAddressJson: JSON.stringify({
          addressLine: rfq.deliveryAddress,
          city: rfq.deliveryCity,
          state: rfq.deliveryState,
          pincode: rfq.deliveryPincode
        }),
        invoiceNumber,
        notes: `Converted from ${rfq.rfqNumber}`,
        auditHistoryJson: JSON.stringify([
          {
            toStatus: 'CONFIRMED',
            actorId: buyerId,
            note: `Quotation accepted for RFQ ${rfq.rfqNumber}`,
            timestamp: new Date().toISOString()
          }
        ]),
        items: {
          create: [
            {
              productId: rfq.productId,
              productTitle: rfq.product.title,
              sku: rfq.product.sku,
              unitOfMeasurement: rfq.product.unitOfMeasurement,
              quantity: quotation.quotedQty,
              agreedUnitPricePaise: quotation.quotedUnitPricePaise,
              tierAppliedJson: JSON.stringify({ source: 'RFQ_QUOTATION', quotationId: quotation.id }),
              taxRatePct: parseTaxRatePct(rfq.product.taxClassification),
              taxPaise: quotation.taxPaise,
              lineTotalPaise: subtotalPaise + quotation.taxPaise
            }
          ]
        }
      },
      include: { items: true }
    });

    await prisma.wholesaleQuotation.update({
      where: { id: quotation.id },
      data: { status: 'CONVERTED' }
    });
    await prisma.wholesaleQuotationRequest.update({
      where: { id: rfq.id },
      data: { status: 'CONVERTED_TO_ORDER' }
    });

    return c.json({ message: 'Quotation accepted and converted to wholesale order', order }, 201);
  } catch (err: any) {
    return c.json({ error: 'Failed to accept quotation', message: err.message }, 500);
  }
});

// ============================================================================
// 5. SUPER ADMIN WHOLESALE MANAGEMENT (STRICT ADMIN ONLY)
// ============================================================================

async function requireAdmin(c: any, next: any) {
  const user = c.get('user');
  if (!user || user.role !== 'ADMIN') {
    return c.json({ error: 'Forbidden: Super Admin access required' }, 403);
  }
  await next();
}

wholesaleRouter.get('/admin/wholesalers', authMiddleware, requireAdmin, async (c) => {
  const prisma = c.get('prisma');
  try {
    const wholesalers = await prisma.wholesalerProfile.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        warehouses: true,
        _count: { select: { products: true, orders: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return c.json({ wholesalers });
  } catch (err: any) {
    return c.json({ error: 'Failed to load wholesalers', message: err.message }, 500);
  }
});

wholesaleRouter.post('/admin/wholesalers/:id/verify', authMiddleware, requireAdmin, async (c) => {
  const prisma = c.get('prisma');
  const admin = c.get('user')!;
  const id = c.req.param('id');

  try {
    const { status, reason, adminNotes } = await c.req.json();
    if (!['APPROVED', 'REJECTED', 'SUSPENDED', 'UNDER_REVIEW'].includes(status)) {
      return c.json({ error: 'Invalid verification status' }, 400);
    }

    const updated = await prisma.wholesalerProfile.update({
      where: { id },
      data: {
        verificationStatus: status,
        isVerified: status === 'APPROVED',
        rejectionReason: status === 'REJECTED' || status === 'SUSPENDED' ? reason || null : null,
        adminNotes: adminNotes || null,
        approvedBy: status === 'APPROVED' ? (admin.userId || admin.id) : null,
        approvedAt: status === 'APPROVED' ? new Date() : null
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: admin.userId || admin.id,
        action: `WHOLESALER_${status}`,
        resourceType: 'WholesalerProfile',
        resourceId: id,
        detailsJson: JSON.stringify({ reason, adminNotes })
      }
    });

    return c.json({ wholesaler: updated });
  } catch (err: any) {
    return c.json({ error: 'Failed to verify wholesaler', message: err.message }, 500);
  }
});

wholesaleRouter.get('/admin/products', authMiddleware, requireAdmin, async (c) => {
  const prisma = c.get('prisma');
  try {
    const products = await prisma.wholesaleProduct.findMany({
      include: {
        wholesaler: { select: { id: true, businessName: true, verificationStatus: true } },
        category: { select: { id: true, name: true } },
        priceTiers: { orderBy: { minQty: 'asc' } },
        inventories: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return c.json({ products });
  } catch (err: any) {
    return c.json({ error: 'Failed to load wholesale products', message: err.message }, 500);
  }
});

wholesaleRouter.post('/admin/products/:id/moderate', authMiddleware, requireAdmin, async (c) => {
  const prisma = c.get('prisma');
  const admin = c.get('user')!;
  const id = c.req.param('id');

  try {
    const { approvalStatus, moderationReason } = await c.req.json();
    if (!['APPROVED', 'REJECTED', 'MODERATED', 'PENDING'].includes(approvalStatus)) {
      return c.json({ error: 'Invalid approval status' }, 400);
    }

    const updated = await prisma.wholesaleProduct.update({
      where: { id },
      data: {
        approvalStatus,
        moderationReason: moderationReason || null,
        status: approvalStatus === 'APPROVED' ? 'ACTIVE' : 'INACTIVE'
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: admin.userId || admin.id,
        action: `WHOLESALE_PRODUCT_${approvalStatus}`,
        resourceType: 'WholesaleProduct',
        resourceId: id,
        detailsJson: JSON.stringify({ moderationReason })
      }
    });

    return c.json({ product: updated });
  } catch (err: any) {
    return c.json({ error: 'Failed to moderate wholesale product', message: err.message }, 500);
  }
});

wholesaleRouter.get('/admin/categories', authMiddleware, requireAdmin, async (c) => {
  const prisma = c.get('prisma');
  try {
    const categories = await prisma.wholesaleCategory.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { products: true } } }
    });
    return c.json({ categories });
  } catch (err: any) {
    return c.json({ error: 'Failed to load wholesale categories', message: err.message }, 500);
  }
});

wholesaleRouter.post('/admin/categories', authMiddleware, requireAdmin, async (c) => {
  const prisma = c.get('prisma');
  try {
    const { name, description, icon, parentId, sortOrder = 99 } = await c.req.json();
    if (!name) return c.json({ error: 'Category name is required' }, 400);

    const slug = `${slugify(name)}-${Math.random().toString(36).slice(2, 5)}`;
    const category = await prisma.wholesaleCategory.create({
      data: {
        name,
        slug,
        description: description || null,
        icon: icon || 'Package',
        parentId: parentId || null,
        sortOrder: Number(sortOrder),
        isActive: true
      }
    });
    return c.json({ category }, 201);
  } catch (err: any) {
    return c.json({ error: 'Failed to create wholesale category', message: err.message }, 500);
  }
});

wholesaleRouter.delete('/admin/categories/:id', authMiddleware, requireAdmin, async (c) => {
  const prisma = c.get('prisma');
  const id = c.req.param('id');
  try {
    await prisma.wholesaleCategory.update({
      where: { id },
      data: { isActive: false }
    });
    return c.json({ message: 'Wholesale category deactivated' });
  } catch (err: any) {
    return c.json({ error: 'Failed to deactivate category', message: err.message }, 500);
  }
});

wholesaleRouter.get('/admin/overview', authMiddleware, requireAdmin, async (c) => {
  const prisma = c.get('prisma');
  try {
    const [orders, rfqs, wholesalers, products] = await Promise.all([
      prisma.wholesaleOrder.findMany({
        include: {
          buyer: { select: { id: true, name: true, email: true } },
          wholesaler: { select: { id: true, businessName: true } },
          items: true
        },
        orderBy: { createdAt: 'desc' },
        take: 100
      }),
      prisma.wholesaleQuotationRequest.findMany({
        include: {
          buyer: { select: { id: true, name: true, email: true } },
          wholesaler: { select: { id: true, businessName: true } },
          product: { select: { id: true, title: true } },
          quotations: true
        },
        orderBy: { createdAt: 'desc' },
        take: 100
      }),
      prisma.wholesalerProfile.count(),
      prisma.wholesaleProduct.count()
    ]);

    const totalGmvPaise = orders.filter((o: any) => o.status !== 'CANCELLED').reduce((s: number, o: any) => s + o.totalPaise, 0);

    return c.json({
      orders,
      rfqs,
      analytics: {
        totalWholesalers: wholesalers,
        totalProducts: products,
        totalOrders: orders.length,
        totalRfqs: rfqs.length,
        totalGmvPaise
      }
    });
  } catch (err: any) {
    return c.json({ error: 'Failed to load admin wholesale overview', message: err.message }, 500);
  }
});
