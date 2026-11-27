import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

declare type D1Database = any;
declare type R2Bucket = any;
declare type KVNamespace = any;

export type Bindings = {
  DB: D1Database;
  MEDIA_BUCKET: R2Bucket;
  CACHE_KV: KVNamespace;
  ENVIRONMENT?: string;
  JWT_SECRET?: string;
  CORS_ORIGIN?: string;
};

export type Variables = {
  prisma: PrismaClient;
  user?: {
    id: string;
    userId: string;
    email: string;
    role: string;
    storeId?: string;
  };
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

let cachedPrisma: PrismaClient | null = null;
function getPrismaClient(d1: D1Database): PrismaClient {
  if (!cachedPrisma) {
    const adapter = new PrismaD1(d1);
    cachedPrisma = new PrismaClient({ adapter });
  }
  return cachedPrisma;
}

// P0 Remediation: Enforce strict secret binding requirement without hardcoded fallbacks
export const COMPROMISED_FALLBACK_SECRET = 'everything_local_indore_jwt_prod_key_2026_secured_cf';

export function getSecret(env: Bindings): string {
  const secret = env.JWT_SECRET;
  if (!secret) {
    throw new Error('SECURITY FATAL: JWT_SECRET secret binding is required. Set via wrangler secret put JWT_SECRET.');
  }
  if (secret.length < 32) {
    throw new Error('SECURITY FATAL: JWT_SECRET must be at least 32 characters.');
  }
  if (secret === COMPROMISED_FALLBACK_SECRET || secret.includes('placeholder') || secret.includes('example')) {
    throw new Error('SECURITY FATAL: Compromised or placeholder JWT_SECRET is strictly forbidden.');
  }
  return secret;
}

// 1. CORS Configuration
app.use('*', async (c, next) => {
  const isDev = c.env.ENVIRONMENT === 'development';
  const allowed = [
    'https://everybazar.everything-local.workers.dev',
    'https://everything-local-web.everything-local.workers.dev',
    'https://everybazaar-web.everything-local.workers.dev',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:4173',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    c.env.CORS_ORIGIN || ''
  ].filter(Boolean);

  const origin = c.req.header('Origin') || '';
  const isAllowed = isDev || allowed.includes(origin) || c.env.CORS_ORIGIN === '*' || !origin;

  const corsMiddleware = cors({
    origin: isAllowed ? (origin || '*') : allowed[0],
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Idempotency-Key', 'x-store-id']
  });

  return corsMiddleware(c, next);
});

// 2. Prisma Injection Middleware
app.use('*', async (c, next) => {
  c.set('prisma', getPrismaClient(c.env.DB));
  await next();
});

// 3. Auth Helper Middleware
export async function authMiddleware(c: any, next: any) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Access token required' }, 401);
  }
  const token = authHeader.split(' ')[1];
  try {
    const secret = getSecret(c.env);
    const decoded = jwt.verify(token, secret, {
      algorithms: ['HS256']
    }) as any;

    if (!decoded || (!decoded.userId && !decoded.id)) {
      return c.json({ error: 'Malformed token payload: Missing subject identity' }, 403);
    }

    c.set('user', {
      ...decoded,
      id: decoded.userId || decoded.id,
      userId: decoded.userId || decoded.id
    });
    await next();
  } catch (err: any) {
    if (err.message && err.message.startsWith('SECURITY FATAL')) {
      return c.json({ error: 'Server authentication configuration error' }, 500);
    }
    return c.json({ error: 'Invalid or expired token' }, 403);
  }
}

// ==========================================
// 4. API Endpoints
// ==========================================

// Health Check
app.get('/api/health', async (c) => {
  const prisma = c.get('prisma');
  let dbStatus = 'CONNECTED';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err: any) {
    dbStatus = 'ERROR: ' + (err.message || 'Unknown');
  }

  return c.json({
    status: 'HEALTHY',
    service: 'EveryBazaar Hyperlocal Engine',
    environment: c.env.ENVIRONMENT || 'production',
    platform: 'Cloudflare Workers (Edge)',
    market: 'Indore, MP',
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// AUTH: Register Customer
app.post('/api/auth/register', async (c) => {
  const prisma = c.get('prisma');
  try {
    const body = await c.req.json();
    const { email, phone, name, password, role = 'CUSTOMER' } = body;

    if (!email || !password || !name) {
      return c.json({ error: 'Name, email and password are required' }, 400);
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, phone ? { phone } : {}] }
    });
    if (existing) {
      return c.json({ error: 'User with this email or phone already exists' }, 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        phone,
        name,
        passwordHash,
        role: role.toUpperCase()
      }
    });

    const secret = getSecret(c.env);
    const token = jwt.sign(
      { userId: user.id, id: user.id, email: user.email, role: user.role },
      secret,
      { expiresIn: '7d' }
    );

    return c.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role, phone: user.phone },
      token
    }, 201);
  } catch (err: any) {
    return c.json({ error: 'Registration failed', message: err.message }, 500);
  }
});

// AUTH: Login
app.post('/api/auth/login', async (c) => {
  const prisma = c.get('prisma');
  try {
    const body = await c.req.json();
    const { emailOrPhone, password } = body;

    if (!emailOrPhone || !password) {
      return c.json({ error: 'Email/phone and password are required' }, 400);
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: emailOrPhone }, { phone: emailOrPhone }]
      },
      include: { stores: true }
    });

    if (!user) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    const storeId = user.stores && user.stores.length > 0 ? user.stores[0].id : undefined;
    const secret = getSecret(c.env);
    const token = jwt.sign(
      { userId: user.id, id: user.id, email: user.email, role: user.role, storeId },
      secret,
      { expiresIn: '7d' }
    );

    return c.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        storeId,
        stores: user.stores
      },
      token
    });
  } catch (err: any) {
    return c.json({ error: 'Login failed', message: err.message }, 500);
  }
});

// AUTH: Current User
app.get('/api/auth/me', authMiddleware, async (c) => {
  const prisma = c.get('prisma');
  const authUser = c.get('user')!;

  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: {
      id: true,
      email: true,
      phone: true,
      name: true,
      role: true,
      stores: true
    }
  });

  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  return c.json({ user });
});

// CATEGORIES: List All / Homepage Categories
app.get('/api/categories', async (c) => {
  const prisma = c.get('prisma');
  try {
    const categories = await prisma.productCategory.findMany({
      where: { parentId: null, isActive: true },
      orderBy: { displayOrder: 'asc' },
      include: {
        children: { where: { isActive: true }, orderBy: { displayOrder: 'asc' } },
        _count: { select: { products: true } }
      }
    });
    return c.json({ categories });
  } catch (err: any) {
    return c.json({ error: 'Failed to fetch categories', message: err.message }, 500);
  }
});

app.get('/api/categories/homepage', async (c) => {
  const prisma = c.get('prisma');
  try {
    const categories = await prisma.productCategory.findMany({
      where: { parentId: null, isActive: true, isHomepageVisible: true },
      orderBy: { displayOrder: 'asc' },
      include: {
        children: { where: { isActive: true }, orderBy: { displayOrder: 'asc' } },
        _count: { select: { products: true } }
      }
    });
    return c.json({ categories });
  } catch (err: any) {
    return c.json({ error: 'Failed to fetch homepage categories', message: err.message }, 500);
  }
});

app.get('/api/categories/:slug', async (c) => {
  const prisma = c.get('prisma');
  const slug = c.req.param('slug');
  try {
    const category = await prisma.productCategory.findUnique({
      where: { slug },
      include: {
        parent: true,
        children: { where: { isActive: true }, orderBy: { displayOrder: 'asc' } },
        _count: { select: { products: true } }
      }
    });
    if (!category) return c.json({ error: 'Category not found' }, 404);
    return c.json({ category });
  } catch (err: any) {
    return c.json({ error: 'Failed to fetch category', message: err.message }, 500);
  }
});

app.get('/api/categories/:slug/products', async (c) => {
  const prisma = c.get('prisma');
  const slug = c.req.param('slug');
  const subcategory = c.req.query('subcategory');
  const brand = c.req.query('brand');
  const inStock = c.req.query('inStock');
  const sortBy = c.req.query('sortBy') || 'relevance';

  try {
    const category = await prisma.productCategory.findUnique({
      where: { slug },
      include: { children: { where: { isActive: true }, orderBy: { displayOrder: 'asc' } } }
    });
    if (!category) return c.json({ error: 'Category not found' }, 404);

    let targetIds = [category.id, ...category.children.map((ch) => ch.id)];
    if (subcategory) {
      const matched = category.children.find((ch) => ch.slug === subcategory);
      if (matched) targetIds = [matched.id];
    }

    const where: any = {
      isAvailable: true,
      OR: [
        { categoryId: { in: targetIds } },
        { subcategoryId: { in: targetIds } },
        { category: { contains: category.name } }
      ]
    };

    if (brand && brand !== 'all') where.brand = brand;
    if (inStock === 'true') where.stock = { gt: 0 };

    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'price_asc') orderBy = { pricePaise: 'asc' };
    if (sortBy === 'price_desc') orderBy = { pricePaise: 'desc' };

    const products = await prisma.product.findMany({
      where,
      orderBy,
      include: {
        store: {
          select: { id: true, name: true, slug: true, category: true, addressLine: true, city: true, isOpen: true }
        }
      },
      take: 50
    });

    const allBrands = Array.from(new Set(products.map((p) => p.brand).filter(Boolean)));

    return c.json({
      category,
      subcategories: category.children,
      products,
      filters: { brands: allBrands }
    });
  } catch (err: any) {
    return c.json({ error: 'Failed to fetch category products', message: err.message }, 500);
  }
});

// CUSTOMER: Stores List
app.get('/api/customer/stores', async (c) => {
  const prisma = c.get('prisma');
  const category = c.req.query('category');
  const search = c.req.query('search');

  try {
    const where: any = { isOpen: true };
    if (category && category !== 'all') {
      where.category = { contains: category };
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } }
      ];
    }

    const stores = await prisma.store.findMany({
      where,
      include: {
        products: {
          take: 50,
          where: { isAvailable: true }
        }
      },
      take: 30
    });

    return c.json({ stores });
  } catch (err: any) {
    return c.json({ error: 'Failed to fetch stores', message: err.message }, 500);
  }
});

// CUSTOMER: Store Detail
app.get('/api/customer/stores/:id', async (c) => {
  const prisma = c.get('prisma');
  const id = c.req.param('id');

  try {
    const store = await prisma.store.findUnique({
      where: { id },
      include: {
        products: {
          where: { isAvailable: true }
        }
      }
    });

    if (!store) {
      return c.json({ error: 'Store not found' }, 404);
    }

    return c.json({ store });
  } catch (err: any) {
    return c.json({ error: 'Failed to fetch store', message: err.message }, 500);
  }
});

// CUSTOMER: Products List
app.get('/api/customer/products', async (c) => {
  const prisma = c.get('prisma');
  const storeId = c.req.query('storeId');
  const category = c.req.query('category');
  const search = c.req.query('search');

  try {
    const where: any = { isAvailable: true };
    if (storeId) where.storeId = storeId;
    if (category && category !== 'all') {
      where.category = { contains: category };
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { brand: { contains: search } }
      ];
    }

    const products = await prisma.product.findMany({
      where,
      take: 50,
      orderBy: { createdAt: 'desc' }
    });

    return c.json({ products });
  } catch (err: any) {
    return c.json({ error: 'Failed to fetch products', message: err.message }, 500);
  }
});

// CUSTOMER: Product Detail
app.get('/api/customer/products/:id', async (c) => {
  const prisma = c.get('prisma');
  const id = c.req.param('id');

  try {
    const product = await prisma.product.findUnique({
      where: { id }
    });

    if (!product) {
      return c.json({ error: 'Product not found' }, 404);
    }

    return c.json({ product });
  } catch (err: any) {
    return c.json({ error: 'Failed to fetch product', message: err.message }, 500);
  }
});

// CUSTOMER: Orders List
app.get('/api/customer/orders', authMiddleware, async (c) => {
  const prisma = c.get('prisma');
  const user = c.get('user')!;

  try {
    const orders = await prisma.order.findMany({
      where: { customerId: user.id },
      include: {
        store: { select: { name: true, category: true, addressLine: true } },
        items: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return c.json({ orders });
  } catch (err: any) {
    return c.json({ error: 'Failed to fetch orders', message: err.message }, 500);
  }
});

// MERCHANT: Dashboard Metrics
app.get('/api/merchant/dashboard', authMiddleware, async (c) => {
  const prisma = c.get('prisma');
  const user = c.get('user')!;

  try {
    const store = await prisma.store.findFirst({
      where: { ownerId: user.id },
      include: {
        products: true,
        orders: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!store) {
      return c.json({ error: 'Store not found for this merchant' }, 404);
    }

    const totalProducts = store.products.length;
    const totalOrders = store.orders.length;
    const totalRevenuePaise = store.orders.reduce((sum, o) => sum + (o.totalAmountPaise || 0), 0);

    return c.json({
      store: {
        id: store.id,
        name: store.name,
        category: store.category,
        isVerified: store.isVerified,
        isOpen: store.isOpen
      },
      metrics: {
        totalProducts,
        totalOrders,
        totalRevenuePaise
      },
      recentOrders: store.orders
    });
  } catch (err: any) {
    return c.json({ error: 'Failed to load merchant dashboard', message: err.message }, 500);
  }
});

// R2 OBJECT STORAGE: Direct Put & Get
app.post('/api/upload', authMiddleware, async (c) => {
  try {
    const body = await c.req.parseBody();
    const file = body['file'];

    if (!file || typeof file === 'string') {
      return c.json({ error: 'Valid file is required' }, 400);
    }

    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Validate size (5MB)
    if (bytes.length > 5 * 1024 * 1024) {
      return c.json({ error: 'File size exceeds 5MB limit' }, 400);
    }

    const user = c.get('user')!;
    const isKyc = c.req.query('isKyc') === 'true';
    const ext = file.name.split('.').pop() || 'jpg';
    let key: string;

    if (isKyc) {
      const tenantId = user.storeId || user.userId;
      key = `kyc/${tenantId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    } else {
      key = `public/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    }

    await c.env.MEDIA_BUCKET.put(key, bytes, {
      httpMetadata: {
        contentType: file.type || 'application/octet-stream'
      },
      customMetadata: {
        ownerId: user.userId,
        storeId: user.storeId || ''
      }
    });

    const url = `/media/${key}`;
    return c.json({ url, key, size: bytes.length, isPrivate: isKyc });
  } catch (err: any) {
    return c.json({ error: 'Upload failed', message: err.message }, 500);
  }
});

// ==========================================
// CATALOGUE & ENVIRONMENT MANAGEMENT
// ==========================================

// Helper: Get active environment in Worker
async function getWorkerActiveEnvironment(prisma: any): Promise<'DEMO' | 'LIVE'> {
  try {
    const latest = await prisma.catalogueAuditLog.findFirst({
      where: { action: 'SWITCH_ENV' },
      orderBy: { createdAt: 'desc' }
    });
    if (latest && latest.environment === 'LIVE') return 'LIVE';
    return 'DEMO';
  } catch {
    return 'DEMO';
  }
}

// ADMIN: Get Catalogue Environment Status
app.get('/api/admin/catalogue-environments/status', authMiddleware, async (c) => {
  const user = c.get('user')!;
  if (user.role !== 'ADMIN') return c.json({ error: 'Admin access required' }, 403);
  const prisma = c.get('prisma');

  try {
    const activeEnvironment = await getWorkerActiveEnvironment(prisma);
    const [demoProducts, demoOffers, demoStores, liveProducts, liveOffers, liveStores, lastSwitch] = await Promise.all([
      prisma.catalogueProduct.count({ where: { environment: 'DEMO' } }),
      prisma.product.count({ where: { environment: 'DEMO' } }),
      prisma.store.count({ where: { products: { some: { environment: 'DEMO' } } } }),
      prisma.catalogueProduct.count({ where: { environment: 'LIVE' } }),
      prisma.product.count({ where: { environment: 'LIVE' } }),
      prisma.store.count({ where: { isVerified: true, products: { some: { environment: 'LIVE' } } } }),
      prisma.catalogueAuditLog.findFirst({ where: { action: 'SWITCH_ENV' }, orderBy: { createdAt: 'desc' } })
    ]);

    return c.json({
      activeEnvironment,
      demo: {
        totalProducts: demoProducts,
        activeOffers: demoOffers,
        participatingStores: demoStores,
        isPopulated: demoProducts >= 500,
        status: 'READY'
      },
      live: {
        totalProducts: liveProducts,
        activeOffers: liveOffers,
        verifiedStores: liveStores,
        isPopulated: liveProducts > 0,
        status: liveProducts > 0 ? 'OPERATIONAL' : 'AWAITING_VERIFIED_MERCHANTS'
      },
      lastSwitchedAt: lastSwitch?.createdAt || null,
      lastSwitchedBy: lastSwitch?.actorEmail || 'System'
    });
  } catch (err: any) {
    return c.json({ error: 'Failed to fetch status', message: err.message }, 500);
  }
});

// ADMIN: Get Filterable Catalogue Products
app.get('/api/admin/catalogue-environments/products', authMiddleware, async (c) => {
  const user = c.get('user')!;
  if (user.role !== 'ADMIN') return c.json({ error: 'Admin access required' }, 403);
  const prisma = c.get('prisma');

  const environment = c.req.query('environment') || 'DEMO';
  const department = c.req.query('department');
  const search = c.req.query('search');
  const page = Math.max(1, parseInt(c.req.query('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') || '50', 10)));
  const skip = (page - 1) * limit;

  const where: any = { environment };
  if (department && department !== 'all') where.department = department;
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { brand: { contains: search } },
      { sku: { contains: search } }
    ];
  }

  try {
    const [products, total] = await Promise.all([
      prisma.catalogueProduct.findMany({
        where,
        orderBy: [{ department: 'asc' }, { name: 'asc' }],
        skip,
        take: limit,
        include: { _count: { select: { offers: true } } }
      }),
      prisma.catalogueProduct.count({ where })
    ]);

    return c.json({
      environment,
      products,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (err: any) {
    return c.json({ error: 'Failed to fetch catalogue products', message: err.message }, 500);
  }
});

// ADMIN: Switch Active Environment
app.post('/api/admin/catalogue-environments/switch', authMiddleware, async (c) => {
  const user = c.get('user')!;
  if (user.role !== 'ADMIN') return c.json({ error: 'Admin access required' }, 403);
  const prisma = c.get('prisma');

  const body = await c.req.json().catch(() => ({}));
  const { targetEnvironment, confirmText, reason } = body;

  if (targetEnvironment !== 'DEMO' && targetEnvironment !== 'LIVE') {
    return c.json({ error: 'Invalid targetEnvironment' }, 400);
  }

  if (targetEnvironment === 'LIVE' && confirmText !== 'SWITCH_TO_LIVE') {
    return c.json({ error: 'Confirmation string "SWITCH_TO_LIVE" required' }, 400);
  }

  const currentEnv = await getWorkerActiveEnvironment(prisma);
  await prisma.catalogueAuditLog.create({
    data: {
      actorId: user.userId,
      actorEmail: user.email,
      action: 'SWITCH_ENV',
      entityType: 'ENVIRONMENT',
      entityId: targetEnvironment,
      environment: targetEnvironment,
      detailsJson: JSON.stringify({ previousEnvironment: currentEnv, reason })
    }
  });

  return c.json({ success: true, activeEnvironment: targetEnvironment });
});

// ADMIN: Catalogue Analytics
app.get('/api/admin/catalogue-environments/analytics', authMiddleware, async (c) => {
  const user = c.get('user')!;
  if (user.role !== 'ADMIN') return c.json({ error: 'Admin access required' }, 403);
  const prisma = c.get('prisma');
  const environment = c.req.query('environment') || 'DEMO';

  try {
    const products = await prisma.catalogueProduct.findMany({
      where: { environment },
      select: { categoryName: true, imageUrl: true }
    });
    const categoryDistribution: Record<string, number> = {};
    let customPhotographs = 0;
    let brandedPlaceholders = 0;

    for (const p of products) {
      categoryDistribution[p.categoryName] = (categoryDistribution[p.categoryName] || 0) + 1;
      if (p.imageUrl.includes('/placeholders/') || p.imageUrl.includes('placeholder.svg')) {
        brandedPlaceholders++;
      } else {
        customPhotographs++;
      }
    }

    return c.json({
      environment,
      totalProducts: products.length,
      mediaCoverage: {
        customPhotographs,
        brandedPlaceholders,
        photographCoveragePercentage: products.length > 0 ? Math.round((customPhotographs / products.length) * 100) : 0
      },
      categoryDistribution
    });
  } catch (err: any) {
    return c.json({ error: 'Failed to fetch analytics', message: err.message }, 500);
  }
});

// ADMIN: Catalogue Audit Logs
app.get('/api/admin/catalogue-environments/audit-logs', authMiddleware, async (c) => {
  const user = c.get('user')!;
  if (user.role !== 'ADMIN') return c.json({ error: 'Admin access required' }, 403);
  const prisma = c.get('prisma');
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') || '50', 10)));

  try {
    const logs = await prisma.catalogueAuditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit
    });
    return c.json({ logs });
  } catch (err: any) {
    return c.json({ error: 'Failed to fetch audit logs', message: err.message }, 500);
  }
});

// MERCHANT: Search Catalogue
app.get('/api/merchant/catalogue/search', authMiddleware, async (c) => {
  const user = c.get('user')!;
  if (user.role !== 'MERCHANT') return c.json({ error: 'Merchant access required' }, 403);
  const prisma = c.get('prisma');

  const q = (c.req.query('q') || '').trim();
  const department = c.req.query('department');
  const activeEnv = await getWorkerActiveEnvironment(prisma);

  const where: any = { environment: activeEnv, status: 'ACTIVE' };
  if (department && department !== 'all') where.department = department;
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { brand: { contains: q } },
      { sku: { contains: q } }
    ];
  }

  try {
    const products = await prisma.catalogueProduct.findMany({
      where,
      orderBy: [{ department: 'asc' }, { name: 'asc' }],
      take: 30
    });
    return c.json({ environment: activeEnv, products });
  } catch (err: any) {
    return c.json({ error: 'Failed to search catalogue', message: err.message }, 500);
  }
});

// ==========================================
// 5. HYPERLOCAL SERVICES MARKETPLACE ENGINE
// ==========================================

export function calculateDistanceKm(
  coord1: { latitude: number; longitude: number },
  coord2: { latitude: number; longitude: number }
): number {
  const toRad = (degree: number) => (degree * Math.PI) / 180;
  const lat1 = coord1.latitude;
  const lon1 = coord1.longitude;
  const lat2 = coord2.latitude;
  const lon2 = coord2.longitude;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = 6371.0 * c;
  return Math.round(distance * 100) / 100;
}

// 5.1 List Active Service Categories
app.get('/api/services/categories', async (c) => {
  const prisma = c.get('prisma');
  try {
    const categories = await prisma.serviceCategory.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
      include: {
        _count: {
          select: { services: { where: { isActive: true } } }
        }
      }
    });
    return c.json({ categories });
  } catch (err: any) {
    return c.json({ error: 'Failed to fetch service categories', message: err.message }, 500);
  }
});

// 5.2 Search & Discover Service Providers
app.get('/api/services/providers', async (c) => {
  const prisma = c.get('prisma');
  const q = (c.req.query('q') || '').trim().toLowerCase();
  const categorySlug = c.req.query('category');
  const fulfillmentType = c.req.query('fulfillment');
  const lat = parseFloat(c.req.query('lat') || '');
  const lng = parseFloat(c.req.query('lng') || '');

  const hasCoords = !isNaN(lat) && !isNaN(lng);
  const customerCoord = hasCoords ? { latitude: lat, longitude: lng } : null;

  const whereClause: any = {
    isOpen: true,
    verificationStatus: 'VERIFIED'
  };

  if (categorySlug && categorySlug !== 'all') {
    whereClause.categorySlug = categorySlug;
  }
  if (fulfillmentType === 'SHOP_VISIT') {
    whereClause.hasShopVisit = true;
  } else if (fulfillmentType === 'HOME_VISIT') {
    whereClause.hasHomeVisit = true;
  }

  try {
    const providers = await prisma.serviceProvider.findMany({
      where: whereClause,
      include: {
        services: {
          where: { isActive: true },
          take: 6
        },
        staff: {
          where: { isActive: true }
        },
        reviews: {
          select: { rating: true }
        }
      }
    });

    const evaluated = providers.map((provider: any) => {
      let distanceKm: number | undefined = undefined;
      let isHomeVisitServiceable = provider.hasHomeVisit;
      let isShopVisitServiceable = provider.hasShopVisit;

      if (customerCoord && provider.shopLatitude && provider.shopLongitude) {
        distanceKm = calculateDistanceKm(
          { latitude: provider.shopLatitude, longitude: provider.shopLongitude },
          customerCoord
        );
        if (provider.hasHomeVisit) {
          isHomeVisitServiceable = distanceKm <= provider.homeVisitRadiusKm;
        }
      }

      const matchesQuery = !q ||
        provider.businessName.toLowerCase().includes(q) ||
        (provider.description && provider.description.toLowerCase().includes(q)) ||
        provider.services.some((s: any) => s.title.toLowerCase().includes(q) || (s.description && s.description.toLowerCase().includes(q)));

      return {
        id: provider.id,
        businessName: provider.businessName,
        slug: provider.slug,
        description: provider.description,
        profileImageUrl: provider.profileImageUrl,
        categorySlug: provider.categorySlug,
        rating: provider.rating,
        reviewCount: provider.reviewCount || provider.reviews.length,
        hasShopVisit: provider.hasShopVisit,
        shopAddressLine: provider.shopAddressLine,
        shopCity: provider.shopCity,
        shopPincode: provider.shopPincode,
        hasHomeVisit: provider.hasHomeVisit,
        homeVisitRadiusKm: provider.homeVisitRadiusKm,
        homeVisitFeePaise: provider.homeVisitFeePaise,
        distanceKm,
        isHomeVisitServiceable,
        isShopVisitServiceable,
        servicesCount: provider.services.length,
        featuredServices: provider.services,
        matchesQuery
      };
    });

    const filtered = evaluated.filter((p: any) => p.matchesQuery);
    if (hasCoords) {
      filtered.sort((a: any, b: any) => (a.distanceKm || 999) - (b.distanceKm || 999));
    } else {
      filtered.sort((a: any, b: any) => b.rating - a.rating);
    }

    return c.json({ total: filtered.length, providers: filtered });
  } catch (err: any) {
    return c.json({ error: 'Failed to discover service providers', message: err.message }, 500);
  }
});

// 5.3 Provider Profile & Listings
app.get('/api/services/providers/:id', async (c) => {
  const prisma = c.get('prisma');
  const id = c.req.param('id');
  const lat = parseFloat(c.req.query('lat') || '');
  const lng = parseFloat(c.req.query('lng') || '');

  try {
    const provider = await prisma.serviceProvider.findFirst({
      where: {
        OR: [{ id }, { slug: id }]
      },
      include: {
        services: {
          where: { isActive: true },
          include: { category: true }
        },
        staff: {
          where: { isActive: true }
        },
        reviews: {
          include: {
            customer: { select: { id: true, name: true } }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!provider) {
      return c.json({ error: 'Service provider not found' }, 404);
    }

    let distanceKm: number | undefined = undefined;
    let isHomeVisitServiceable = provider.hasHomeVisit;

    if (!isNaN(lat) && !isNaN(lng) && provider.shopLatitude && provider.shopLongitude) {
      distanceKm = calculateDistanceKm(
        { latitude: provider.shopLatitude, longitude: provider.shopLongitude },
        { latitude: lat, longitude: lng }
      );
      isHomeVisitServiceable = distanceKm <= provider.homeVisitRadiusKm;
    }

    return c.json({
      provider: {
        ...provider,
        distanceKm,
        isHomeVisitServiceable
      }
    });
  } catch (err: any) {
    return c.json({ error: 'Failed to fetch provider profile', message: err.message }, 500);
  }
});

// 5.4 Appointment Slots
app.get('/api/services/slots', async (c) => {
  const prisma = c.get('prisma');
  const providerId = c.req.query('providerId');
  const date = c.req.query('date');

  if (!providerId || !date) {
    return c.json({ error: 'providerId and date (YYYY-MM-DD) are required' }, 400);
  }

  const standardSlots = [
    '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM',
    '02:30 PM', '03:30 PM', '04:30 PM', '05:30 PM', '06:30 PM'
  ];

  try {
    const booked = await prisma.serviceBooking.findMany({
      where: {
        providerId,
        bookingDate: date,
        status: { notIn: ['CANCELLED', 'REJECTED'] }
      },
      select: { timeSlot: true }
    });

    const bookedSet = new Set(booked.map((b: any) => b.timeSlot));
    const slots = standardSlots.map((timeSlot) => ({
      timeSlot,
      date,
      isAvailable: !bookedSet.has(timeSlot)
    }));

    return c.json({ date, slots });
  } catch (err: any) {
    return c.json({ error: 'Failed to fetch available slots', message: err.message }, 500);
  }
});

// 5.5 Create Service Booking
app.post('/api/services/bookings', authMiddleware, async (c) => {
  const user = c.get('user')!;
  const prisma = c.get('prisma');
  const userId = user.userId || user.id;

  try {
    const body = await c.req.json();
    const {
      providerId,
      serviceId,
      fulfillmentType,
      bookingDate,
      timeSlot,
      customerAddressLine,
      customerLocality,
      customerCity = 'Indore',
      customerPincode,
      customerLat,
      customerLng,
      instructions,
      staffId
    } = body;

    if (!providerId || !serviceId || !fulfillmentType || !bookingDate || !timeSlot) {
      return c.json({ error: 'providerId, serviceId, fulfillmentType, bookingDate, and timeSlot are required' }, 400);
    }

    const provider = await prisma.serviceProvider.findUnique({
      where: { id: providerId }
    });
    if (!provider || !provider.isOpen || provider.verificationStatus !== 'VERIFIED') {
      return c.json({ error: 'Provider is currently not accepting bookings' }, 400);
    }

    const service = await prisma.serviceListing.findFirst({
      where: { id: serviceId, providerId, isActive: true }
    });
    if (!service) {
      return c.json({ error: 'Service listing not found or inactive' }, 404);
    }

    if (fulfillmentType === 'SHOP_VISIT' && !service.allowsShopVisit) {
      return c.json({ error: 'This service does not support shop visits' }, 400);
    }
    if (fulfillmentType === 'HOME_VISIT' && (!service.allowsHomeVisit || !provider.hasHomeVisit)) {
      return c.json({ error: 'This service does not support home visits' }, 400);
    }

    const serviceFeePaise = service.pricePaise;
    const travelFeePaise = fulfillmentType === 'HOME_VISIT' ? provider.homeVisitFeePaise : 0;
    const totalAmountPaise = serviceFeePaise + travelFeePaise;
    const commissionPaise = Math.round((totalAmountPaise * provider.commissionRatePct) / 100);
    const providerPayablePaise = totalAmountPaise - commissionPaise;
    const platformRevenuePaise = commissionPaise;

    const bookingNumber = `BKG-IND-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const newBooking = await prisma.serviceBooking.create({
      data: {
        bookingNumber,
        customerId: userId,
        providerId,
        serviceId,
        staffId: staffId || null,
        fulfillmentType,
        bookingDate,
        timeSlot,
        status: 'CONFIRMED',
        customerAddressLine,
        customerLocality,
        customerCity,
        customerPincode,
        customerLat: customerLat !== undefined ? parseFloat(customerLat) : null,
        customerLng: customerLng !== undefined ? parseFloat(customerLng) : null,
        instructions,
        serviceFeePaise,
        travelFeePaise,
        totalAmountPaise,
        commissionPaise,
        providerPayablePaise,
        platformRevenuePaise,
        paymentStatus: 'PENDING'
      },
      include: {
        provider: true,
        service: true,
        staff: true
      }
    });

    await prisma.bookingStatusEvent.create({
      data: {
        bookingId: newBooking.id,
        status: 'CONFIRMED',
        actorId: userId,
        actorRole: 'CUSTOMER',
        note: `Appointment confirmed for ${bookingDate} at ${timeSlot} (${fulfillmentType.replace(/_/g, ' ')})`
      }
    });

    await prisma.providerEarning.create({
      data: {
        providerId,
        bookingId: newBooking.id,
        amountPaise: totalAmountPaise,
        commissionPaise,
        netEarningPaise: providerPayablePaise,
        payoutStatus: 'PENDING',
        reference: bookingNumber
      }
    });

    return c.json({ message: 'Service appointment successfully booked', booking: newBooking }, 201);
  } catch (err: any) {
    return c.json({ error: 'Booking creation failed', message: err.message }, 400);
  }
});

// 5.6 Customer Bookings History
app.get('/api/services/bookings', authMiddleware, async (c) => {
  const user = c.get('user')!;
  const prisma = c.get('prisma');
  const userId = user.userId || user.id;

  try {
    const bookings = await prisma.serviceBooking.findMany({
      where: { customerId: userId },
      include: {
        provider: true,
        service: true,
        staff: true,
        review: true,
        events: { orderBy: { createdAt: 'desc' } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return c.json({ bookings });
  } catch (err: any) {
    return c.json({ error: 'Failed to fetch customer bookings', message: err.message }, 500);
  }
});

// 5.7 Cancel Booking
app.post('/api/services/bookings/:id/cancel', authMiddleware, async (c) => {
  const user = c.get('user')!;
  const prisma = c.get('prisma');
  const userId = user.userId || user.id;
  const id = c.req.param('id');
  const body = await c.req.json().catch(() => ({}));

  try {
    const booking = await prisma.serviceBooking.findFirst({
      where: { id, customerId: userId }
    });

    if (!booking) {
      return c.json({ error: 'Booking not found' }, 404);
    }
    if (['COMPLETED', 'CANCELLED', 'REJECTED'].includes(booking.status)) {
      return c.json({ error: `Cannot cancel booking in status: ${booking.status}` }, 400);
    }

    const updated = await prisma.serviceBooking.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancellationReason: body.reason || 'Cancelled by customer'
      }
    });

    await prisma.bookingStatusEvent.create({
      data: {
        bookingId: id,
        status: 'CANCELLED',
        actorId: userId,
        actorRole: 'CUSTOMER',
        note: body.reason || 'Cancelled by customer'
      }
    });

    return c.json({ message: 'Booking successfully cancelled', booking: updated });
  } catch (err: any) {
    return c.json({ error: 'Failed to cancel booking', message: err.message }, 500);
  }
});

// 5.8 Reschedule Booking
app.post('/api/services/bookings/:id/reschedule', authMiddleware, async (c) => {
  const user = c.get('user')!;
  const prisma = c.get('prisma');
  const userId = user.userId || user.id;
  const id = c.req.param('id');
  const body = await c.req.json();
  const targetDate = body.bookingDate || body.newDate;
  const targetSlot = body.timeSlot || body.newTimeSlot;

  if (!targetDate || !targetSlot) {
    return c.json({ error: 'bookingDate and timeSlot are required' }, 400);
  }

  try {
    const booking = await prisma.serviceBooking.findFirst({
      where: { id, customerId: userId }
    });
    if (!booking || ['COMPLETED', 'CANCELLED'].includes(booking.status)) {
      return c.json({ error: 'Cannot reschedule this booking' }, 400);
    }

    const updated = await prisma.serviceBooking.update({
      where: { id },
      data: {
        bookingDate: targetDate,
        timeSlot: targetSlot
      }
    });

    await prisma.bookingStatusEvent.create({
      data: {
        bookingId: id,
        status: booking.status,
        actorId: userId,
        actorRole: 'CUSTOMER',
        note: `Rescheduled to ${targetDate} at ${targetSlot}`
      }
    });

    return c.json({ message: 'Booking successfully rescheduled', booking: updated });
  } catch (err: any) {
    return c.json({ error: 'Failed to reschedule booking', message: err.message }, 500);
  }
});

// 5.9 Review Service
app.post('/api/services/bookings/:id/review', authMiddleware, async (c) => {
  const user = c.get('user')!;
  const prisma = c.get('prisma');
  const userId = user.userId || user.id;
  const id = c.req.param('id');
  const body = await c.req.json();
  const { rating, comment } = body;

  if (!rating || rating < 1 || rating > 5) {
    return c.json({ error: 'Valid rating between 1 and 5 required' }, 400);
  }

  try {
    const booking = await prisma.serviceBooking.findFirst({
      where: { id, customerId: userId }
    });
    if (!booking || booking.status !== 'COMPLETED') {
      return c.json({ error: 'Reviews can only be submitted for completed services' }, 400);
    }

    const review = await prisma.serviceReview.create({
      data: {
        bookingId: id,
        providerId: booking.providerId,
        customerId: userId,
        rating: Math.round(rating),
        comment: comment ? String(comment).trim() : null
      }
    });

    const allReviews = await prisma.serviceReview.findMany({
      where: { providerId: booking.providerId },
      select: { rating: true }
    });
    const avg = allReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / allReviews.length;
    await prisma.serviceProvider.update({
      where: { id: booking.providerId },
      data: {
        rating: Math.round(avg * 10) / 10,
        reviewCount: allReviews.length
      }
    });

    return c.json({ message: 'Review recorded', review }, 201);
  } catch (err: any) {
    return c.json({ error: 'Failed to submit review', message: err.message }, 400);
  }
});

// 5.10 Service Partner Console Data
app.get('/api/services/provider/console', authMiddleware, async (c) => {
  const user = c.get('user')!;
  const prisma = c.get('prisma');
  const userId = user.userId || user.id;

  if (user.role !== 'MERCHANT' && user.role !== 'PROVIDER' && user.role !== 'ADMIN') {
    return c.json({ error: 'Access denied: Partner console is restricted to registered service providers' }, 403);
  }

  try {
    const provider = await prisma.serviceProvider.findFirst({
      where: {
        OR: [
          { ownerId: userId },
          { ownerId: user.id },
          ...(user.email ? [{ contactEmail: user.email }] : [])
        ]
      },
      include: {
        services: true,
        staff: true,
        bookings: {
          include: {
            customer: { select: { id: true, name: true, phone: true } },
            service: true,
            staff: true
          },
          orderBy: { createdAt: 'desc' },
          take: 50
        },
        earnings: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!provider) {
      return c.json({ error: 'No service provider profile registered for this account' }, 404);
    }

    const completedBookings = provider.bookings.filter((b: any) => b.status === 'COMPLETED');
    const totalRevenuePaise = completedBookings.reduce((sum: number, b: any) => sum + b.totalAmountPaise, 0);
    const totalNetEarningsPaise = completedBookings.reduce((sum: number, b: any) => sum + b.providerPayablePaise, 0);
    const pendingBookingsCount = provider.bookings.filter((b: any) =>
      ['PENDING_CONFIRMATION', 'CONFIRMED', 'IN_PROGRESS', 'PROVIDER_ASSIGNED'].includes(b.status)
    ).length;

    return c.json({
      provider,
      metrics: {
        totalBookings: provider.bookings.length,
        completedBookings: completedBookings.length,
        pendingBookings: pendingBookingsCount,
        totalRevenuePaise,
        totalNetEarningsPaise
      }
    });
  } catch (err: any) {
    return c.json({ error: 'Failed to fetch provider console data', message: err.message }, 500);
  }
});

// 5.11 Provider Update Booking Status
app.post('/api/services/provider/bookings/:id/status', authMiddleware, async (c) => {
  const user = c.get('user')!;
  const prisma = c.get('prisma');
  const userId = user.userId || user.id;
  const id = c.req.param('id');
  const body = await c.req.json();
  const { status, note, staffId } = body;

  try {
    const provider = await prisma.serviceProvider.findFirst({
      where: {
        OR: [
          { ownerId: userId },
          { ownerId: user.id },
          ...(user.email ? [{ contactEmail: user.email }] : [])
        ]
      }
    });

    if (!provider) {
      return c.json({ error: 'Unauthorized: Only registered providers can update bookings' }, 403);
    }

    const booking = await prisma.serviceBooking.findFirst({
      where: { id, providerId: provider.id }
    });

    if (!booking) {
      return c.json({ error: 'Booking not found' }, 404);
    }

    const updated = await prisma.serviceBooking.update({
      where: { id },
      data: {
        status,
        ...(staffId !== undefined ? { staffId } : {})
      }
    });

    await prisma.bookingStatusEvent.create({
      data: {
        bookingId: id,
        status,
        actorId: userId,
        actorRole: 'PROVIDER',
        note: note || `Status updated to ${status.replace(/_/g, ' ')}`
      }
    });

    if (status === 'COMPLETED') {
      await prisma.providerEarning.updateMany({
        where: { bookingId: id },
        data: { payoutStatus: 'PROCESSED' }
      });
    }

    return c.json({ message: 'Booking status updated successfully', booking: updated });
  } catch (err: any) {
    return c.json({ error: 'Failed to update booking status', message: err.message }, 500);
  }
});

// 5.12 Provider Create Service Listing
app.post('/api/services/provider/services', authMiddleware, async (c) => {
  const user = c.get('user')!;
  const prisma = c.get('prisma');
  const userId = user.userId || user.id;
  const body = await c.req.json();

  try {
    const provider = await prisma.serviceProvider.findFirst({
      where: {
        OR: [
          { ownerId: userId },
          { ownerId: user.id },
          ...(user.email ? [{ contactEmail: user.email }] : [])
        ]
      }
    });

    if (!provider) {
      return c.json({ error: 'Provider profile required' }, 403);
    }

    const { title, categoryId, description, pricePaise, mrpPaise, durationMinutes, allowsShopVisit, allowsHomeVisit } = body;

    const service = await prisma.serviceListing.create({
      data: {
        providerId: provider.id,
        categoryId,
        title,
        description,
        pricePaise: parseInt(pricePaise, 10),
        mrpPaise: mrpPaise ? parseInt(mrpPaise, 10) : null,
        durationMinutes: parseInt(durationMinutes, 10) || 45,
        allowsShopVisit: allowsShopVisit !== false,
        allowsHomeVisit: allowsHomeVisit !== false
      }
    });

    return c.json({ message: 'Service created successfully', service }, 201);
  } catch (err: any) {
    return c.json({ error: 'Failed to create service', message: err.message }, 500);
  }
});

// 5.13 Admin Service Management
app.get('/api/services/admin/providers', authMiddleware, async (c) => {
  const user = c.get('user')!;
  if (user.role !== 'ADMIN') return c.json({ error: 'Admin permission required' }, 403);
  const prisma = c.get('prisma');

  try {
    const providers = await prisma.serviceProvider.findMany({
      include: {
        owner: { select: { id: true, name: true, email: true, phone: true } },
        _count: {
          select: { services: true, bookings: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return c.json({ providers });
  } catch (err: any) {
    return c.json({ error: 'Failed to load providers', message: err.message }, 500);
  }
});

app.post('/api/services/admin/providers/:id/verify', authMiddleware, async (c) => {
  const user = c.get('user')!;
  if (user.role !== 'ADMIN') return c.json({ error: 'Admin permission required' }, 403);
  const prisma = c.get('prisma');
  const id = c.req.param('id');
  const body = await c.req.json();
  const { status } = body;

  try {
    const updated = await prisma.serviceProvider.update({
      where: { id },
      data: {
        verificationStatus: status,
        isVerified: status === 'VERIFIED'
      }
    });
    return c.json({ message: `Provider status updated to ${status}`, provider: updated });
  } catch (err: any) {
    return c.json({ error: 'Failed to update provider status', message: err.message }, 500);
  }
});

app.get('/api/services/admin/bookings', authMiddleware, async (c) => {
  const user = c.get('user')!;
  if (user.role !== 'ADMIN') return c.json({ error: 'Admin permission required' }, 403);
  const prisma = c.get('prisma');

  try {
    const bookings = await prisma.serviceBooking.findMany({
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        provider: { select: { id: true, businessName: true, contactPhone: true } },
        service: { select: { id: true, title: true, pricePaise: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    const totalGmvPaise = bookings.reduce((sum: number, b: any) => sum + b.totalAmountPaise, 0);
    const totalPlatformRevenuePaise = bookings.reduce((sum: number, b: any) => sum + b.platformRevenuePaise, 0);

    return c.json({
      bookings,
      stats: {
        totalBookings: bookings.length,
        totalGmvPaise,
        totalPlatformRevenuePaise
      }
    });
  } catch (err: any) {
    return c.json({ error: 'Failed to load bookings', message: err.message }, 500);
  }
});

// Helper: Strict R2 Object Key Sanitization to Prevent Directory Traversal in Cloudflare Workers
export function sanitizeR2Key(prefix: string, rawSubPath: string): string | null {
  try {
    const decoded = decodeURIComponent(rawSubPath);
    if (
      decoded.includes('..') ||
      decoded.includes('\\') ||
      decoded.startsWith('/') ||
      !/^[a-zA-Z0-9_\-\.\/]+$/.test(decoded)
    ) {
      return null;
    }
    const cleanPath = decoded.replace(/\/+/g, '/').replace(/^\//, '');
    const strippedPath = cleanPath.startsWith(`${prefix}/`) ? cleanPath.slice(prefix.length + 1) : cleanPath;
    return `${prefix}/${strippedPath}`;
  } catch {
    return null;
  }
}

// Serve Public Images from R2
app.get('/media/public/*', async (c) => {
  const rawSubPath = c.req.path.replace('/media/public/', '');
  const objectKey = sanitizeR2Key('public', rawSubPath);
  if (!objectKey) {
    return c.text('Bad Request: Invalid object key or directory traversal detected', 400);
  }

  const object = await c.env.MEDIA_BUCKET.get(objectKey);
  if (!object) {
    return c.text('Asset Not Found', 404);
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('Cache-Control', 'public, max-age=86400');

  return new Response(object.body, { headers });
});

// Serve Private KYC from R2 (Strict Tenant Isolated Access)
app.get('/media/kyc/*', authMiddleware, async (c) => {
  const user = c.get('user')!;
  // Check authorization: only ADMIN or MERCHANT role allowed
  if (user.role !== 'ADMIN' && user.role !== 'MERCHANT') {
    return c.text('Forbidden: Unauthorized KYC Access', 403);
  }

  const rawSubPath = c.req.path.replace('/media/kyc/', '');
  const objectKey = sanitizeR2Key('kyc', rawSubPath);
  if (!objectKey) {
    return c.text('Bad Request: Invalid object key or directory traversal detected', 400);
  }

  const object = await c.env.MEDIA_BUCKET.get(objectKey);
  if (!object) {
    return c.text('KYC Document Not Found', 404);
  }

  // Tenant Isolation: Non-admin merchants can ONLY access their own KYC documents
  if (user.role !== 'ADMIN') {
    const keyWithoutPrefix = objectKey.slice('kyc/'.length);
    const pathTenantId = keyWithoutPrefix.includes('/') ? keyWithoutPrefix.split('/')[0] : null;
    const metaOwnerId = object.customMetadata?.ownerId;
    const metaStoreId = object.customMetadata?.storeId;

    const matchesPath = pathTenantId && ((user.storeId && pathTenantId === user.storeId) || (user.userId && pathTenantId === user.userId));
    const matchesMeta = (metaOwnerId && metaOwnerId === user.userId) || (metaStoreId && user.storeId && metaStoreId === user.storeId);

    if (!matchesPath && !matchesMeta) {
      return c.text('Forbidden: Access to another tenant\'s KYC documents is denied', 403);
    }
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('Cache-Control', 'private, no-cache');

  return new Response(object.body, { headers });
});

// Serve Private Medical Prescriptions from R2 (Strict Authenticated Access)
app.get('/media/prescriptions/*', authMiddleware, async (c) => {
  const user = c.get('user')!;
  if (user.role !== 'ADMIN' && user.role !== 'PHARMACIST' && user.role !== 'CUSTOMER') {
    return c.text('Forbidden: Unauthorized Medical Document Access', 403);
  }

  const rawSubPath = c.req.path.replace('/media/prescriptions/', '');
  const objectKey = sanitizeR2Key('prescriptions', rawSubPath);
  if (!objectKey) {
    return c.text('Bad Request: Invalid document key or directory traversal detected', 400);
  }

  const object = await c.env.MEDIA_BUCKET.get(objectKey);
  if (!object) {
    return c.text('Prescription Document Not Found', 404);
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('Cache-Control', 'private, no-cache, no-store');

  return new Response(object.body, { headers });
});

export default app;
