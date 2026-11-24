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
  const allowed = [
    'https://everything-local-web.everything-local.workers.dev',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    c.env.CORS_ORIGIN || ''
  ].filter(Boolean);

  const origin = c.req.header('Origin') || '';
  const isAllowed = allowed.includes(origin) || !origin;

  const corsMiddleware = cors({
    origin: isAllowed ? origin : allowed[0],
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
    service: 'Everything Local Hyperlocal Engine',
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
          take: 6,
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
