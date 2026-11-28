import { Hono } from 'hono';
import { authMiddleware, Bindings, Variables } from '../worker';

export const publicAppsRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();
export const adminAppReleasesRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

export const VALID_APP_TYPES = ['CUSTOMER', 'SELLER', 'DELIVERY_PARTNER', 'WHOLESALER'] as const;
export type ValidAppType = (typeof VALID_APP_TYPES)[number];

export const APP_CATALOGUE_META: Record<
  ValidAppType,
  {
    appType: ValidAppType;
    appName: string;
    packageId: string;
    description: string;
    features: string[];
    ctaLabel: string;
    iconPath: string;
  }
> = {
  CUSTOMER: {
    appType: 'CUSTOMER',
    appName: 'EveryBazaar Customer',
    packageId: 'com.ayushp0021.everythinglocal.customer',
    description: 'Discover local stores, shop products, order essentials and explore services.',
    features: [
      'Discover local stores',
      'Shop products',
      'Track orders',
      'Book services',
      'Wholesale shopping',
      'Manage profile'
    ],
    ctaLabel: 'Download Customer App',
    iconPath: '/brand/everybazaar-official-logo.png'
  },
  SELLER: {
    appType: 'SELLER',
    appName: 'EveryBazaar Seller',
    packageId: 'com.ayushp0021.everythinglocal.merchant',
    description: 'Manage your store, products, inventory, orders and business performance.',
    features: [
      'Manage products',
      'Update inventory',
      'Receive orders',
      'Manage customers',
      'Track revenue',
      'Business analytics'
    ],
    ctaLabel: 'Download Seller App',
    iconPath: '/brand/app-icon-merchant.svg'
  },
  DELIVERY_PARTNER: {
    appType: 'DELIVERY_PARTNER',
    appName: 'EveryBazaar Delivery Partner',
    packageId: 'com.ayushp0021.everythinglocal.delivery',
    description: 'Manage deliveries, accept assignments and track your earnings.',
    features: [
      'Delivery assignments',
      'Pickup and delivery workflow',
      'Navigation',
      'Delivery history',
      'Earnings',
      'Profile'
    ],
    ctaLabel: 'Download Delivery App',
    iconPath: '/brand/app-icon-delivery.svg'
  },
  WHOLESALER: {
    appType: 'WHOLESALER',
    appName: 'EveryBazaar Wholesale',
    packageId: 'com.ayushp0021.everythinglocal.wholesaler',
    description: 'Manage bulk products, MOQ, pricing, wholesale orders and quotations.',
    features: [
      'Manage wholesale listings',
      'Set MOQ',
      'Configure tier pricing',
      'Manage bulk inventory',
      'Receive RFQs',
      'Manage wholesale orders'
    ],
    ctaLabel: 'Download Wholesaler App',
    iconPath: '/brand/app-icon-shop.svg'
  }
};

const MAX_APK_SIZE_BYTES = 150 * 1024 * 1024; // 150 MB configurable ceiling for Android APKs
const ALLOWED_APK_MIME_TYPES = new Set([
  'application/vnd.android.package-archive',
  'application/octet-stream',
  'application/zip',
  'application/x-zip-compressed',
  ''
]);

function sanitizePublicRelease(rel: any) {
  if (!rel) return null;
  return {
    id: rel.id,
    appType: rel.appType,
    appName: rel.appName,
    versionName: rel.versionName,
    versionCode: rel.versionCode,
    releaseNotes: rel.releaseNotes,
    fileSizeBytes: rel.fileSizeBytes,
    sha256Checksum: rel.sha256Checksum,
    minAndroidVersion: rel.minAndroidVersion,
    publishedAt: rel.publishedAt,
    downloadCount: rel.downloadCount,
    downloadUrl: `/api/apps/${rel.appType}/download/${rel.id}`
  };
}

async function sha256Hex(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function hashIp(ip: string): Promise<string> {
  const data = new TextEncoder().encode(ip);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .slice(0, 12)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ============================================================================
// 1. PUBLIC APP PORTAL ENDPOINTS (/api/apps)
// ============================================================================

// GET /api/apps
publicAppsRouter.get('/', async (c) => {
  const prisma = c.get('prisma');
  try {
    const publishedLatest = await prisma.appRelease.findMany({
      where: {
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        isLatest: true
      },
      orderBy: { publishedAt: 'desc' }
    });

    const latestMap: Record<string, any> = {};
    for (const rel of publishedLatest) {
      if (!latestMap[rel.appType]) {
        latestMap[rel.appType] = rel;
      }
    }

    const apps = VALID_APP_TYPES.map((type) => ({
      ...APP_CATALOGUE_META[type],
      platform: 'Android',
      latestRelease: sanitizePublicRelease(latestMap[type] || null)
    }));

    return c.json({ apps });
  } catch (err: any) {
    return c.json({ error: 'Failed to load EveryBazaar apps', message: err.message }, 500);
  }
});

// GET /api/apps/:appType/latest
publicAppsRouter.get('/:appType/latest', async (c) => {
  const prisma = c.get('prisma');
  const appType = c.req.param('appType').toUpperCase() as ValidAppType;
  if (!VALID_APP_TYPES.includes(appType)) {
    return c.json({ error: 'Invalid appType' }, 400);
  }

  try {
    const release = await prisma.appRelease.findFirst({
      where: {
        appType,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        isLatest: true
      }
    });

    if (!release) {
      return c.json({ app: APP_CATALOGUE_META[appType], latestRelease: null });
    }

    return c.json({
      app: APP_CATALOGUE_META[appType],
      latestRelease: sanitizePublicRelease(release)
    });
  } catch (err: any) {
    return c.json({ error: 'Failed to load latest release', message: err.message }, 500);
  }
});

// GET /api/apps/:appType/releases
publicAppsRouter.get('/:appType/releases', async (c) => {
  const prisma = c.get('prisma');
  const appType = c.req.param('appType').toUpperCase() as ValidAppType;
  if (!VALID_APP_TYPES.includes(appType)) {
    return c.json({ error: 'Invalid appType' }, 400);
  }

  try {
    const releases = await prisma.appRelease.findMany({
      where: {
        appType,
        status: 'PUBLISHED',
        visibility: 'PUBLIC'
      },
      orderBy: { versionCode: 'desc' },
      take: 20
    });

    return c.json({
      app: APP_CATALOGUE_META[appType],
      releases: releases.map(sanitizePublicRelease)
    });
  } catch (err: any) {
    return c.json({ error: 'Failed to load releases', message: err.message }, 500);
  }
});

// GET /api/apps/:appType/download/:releaseId
publicAppsRouter.get('/:appType/download/:releaseId', async (c) => {
  const prisma = c.get('prisma');
  const appType = c.req.param('appType').toUpperCase() as ValidAppType;
  const releaseId = c.req.param('releaseId');

  if (!VALID_APP_TYPES.includes(appType)) {
    return c.json({ error: 'Invalid appType' }, 400);
  }

  try {
    const release = await prisma.appRelease.findFirst({
      where: {
        id: releaseId,
        appType,
        status: 'PUBLISHED',
        visibility: 'PUBLIC'
      }
    });

    if (!release) {
      return c.json({ error: 'Published release not found' }, 404);
    }

    const object = await c.env.MEDIA_BUCKET.get(release.objectKey);
    if (!object) {
      return c.json({ error: 'APK binary missing from storage' }, 404);
    }

    // Track actual file download (skip Range continuation requests > bytes=0-)
    const rangeHeader = c.req.header('Range') || '';
    const isInitialDownload = !rangeHeader || rangeHeader.startsWith('bytes=0-');

    if (isInitialDownload) {
      const clientIp = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
      const clientIpHash = await hashIp(clientIp);
      const twoMinsAgo = new Date(Date.now() - 2 * 60 * 1000);

      const recentDup = await prisma.appDownloadEvent.findFirst({
        where: {
          releaseId: release.id,
          clientIpHash,
          downloadedAt: { gte: twoMinsAgo }
        }
      });

      if (!recentDup) {
        await prisma.appDownloadEvent.create({
          data: {
            releaseId: release.id,
            appType: release.appType,
            clientIpHash,
            userAgent: (c.req.header('User-Agent') || '').slice(0, 250)
          }
        });
        await prisma.appRelease.update({
          where: { id: release.id },
          data: { downloadCount: { increment: 1 } }
        });
      }
    }

    const fileName = `EveryBazaar-${release.appType.toLowerCase()}-v${release.versionName}.apk`;
    const headers = new Headers();
    headers.set('Content-Type', 'application/vnd.android.package-archive');
    headers.set('Content-Disposition', `attachment; filename="${fileName}"`);
    headers.set('Content-Length', String(object.size));
    headers.set('Cache-Control', 'public, max-age=3600');
    if (release.sha256Checksum) {
      headers.set('X-Checksum-SHA256', release.sha256Checksum);
    }

    return new Response(object.body, { headers });
  } catch (err: any) {
    return c.json({ error: 'APK download failed', message: err.message }, 500);
  }
});

// ============================================================================
// 2. SUPER ADMIN APP RELEASE MANAGER (/api/admin/app-releases)
// ============================================================================

async function requireAdmin(c: any, next: any) {
  const user = c.get('user');
  if (!user || user.role !== 'ADMIN') {
    return c.json({ error: 'Forbidden: Only Super Admin can manage app releases' }, 403);
  }
  await next();
}

adminAppReleasesRouter.use('*', authMiddleware, requireAdmin);

// GET /api/admin/app-releases
adminAppReleasesRouter.get('/', async (c) => {
  const prisma = c.get('prisma');
  const appType = c.req.query('appType')?.toUpperCase();

  try {
    const where: any = {};
    if (appType && VALID_APP_TYPES.includes(appType as ValidAppType)) {
      where.appType = appType;
    }

    const [releases, totalDownloads] = await Promise.all([
      prisma.appRelease.findMany({
        where,
        orderBy: [{ appType: 'asc' }, { versionCode: 'desc' }]
      }),
      prisma.appDownloadEvent.count({ where: appType ? { appType } : {} })
    ]);

    return c.json({
      apps: VALID_APP_TYPES.map((t) => APP_CATALOGUE_META[t]),
      releases,
      totalDownloads
    });
  } catch (err: any) {
    return c.json({ error: 'Failed to load app releases', message: err.message }, 500);
  }
});

// POST /api/admin/app-releases/upload
adminAppReleasesRouter.post('/upload', async (c) => {
  const prisma = c.get('prisma');
  const admin = c.get('user')!;

  try {
    const formData = await c.req.formData();
    const file = formData.get('apk') || formData.get('file');
    const appType = String(formData.get('appType') || '').toUpperCase() as ValidAppType;
    const versionName = String(formData.get('versionName') || '').trim();
    const versionCode = Number(formData.get('versionCode'));
    const releaseNotes = String(formData.get('releaseNotes') || '').trim();
    const minAndroidVersion = String(formData.get('minAndroidVersion') || '7.0 (API 24)').trim();
    const visibility = String(formData.get('visibility') || 'PUBLIC').toUpperCase();

    if (!VALID_APP_TYPES.includes(appType)) {
      return c.json({ error: 'Valid appType is required (CUSTOMER, SELLER, DELIVERY_PARTNER, WHOLESALER)' }, 400);
    }
    if (!versionName || !Number.isInteger(versionCode) || versionCode < 1) {
      return c.json({ error: 'Valid versionName and integer versionCode (>= 1) are required' }, 400);
    }
    if (!releaseNotes) {
      return c.json({ error: 'Release notes are required' }, 400);
    }
    if (!file || typeof file === 'string') {
      return c.json({ error: 'APK file is required' }, 400);
    }

    const fileName = file.name || '';
    if (!fileName.toLowerCase().endsWith('.apk')) {
      return c.json({ error: 'Invalid file extension: Only .apk files are permitted' }, 400);
    }
    if (file.type && !ALLOWED_APK_MIME_TYPES.has(file.type)) {
      return c.json({ error: `Invalid MIME type: ${file.type}. Expected Android APK package.` }, 400);
    }

    // Prevent duplicate versionCode for the same appType
    const existing = await prisma.appRelease.findUnique({
      where: {
        appType_versionCode: { appType, versionCode }
      }
    });
    if (existing) {
      return c.json({ error: `Version code ${versionCode} already exists for ${appType}` }, 409);
    }

    const buffer = await file.arrayBuffer();
    if (buffer.byteLength === 0) {
      return c.json({ error: 'Empty APK file rejected' }, 400);
    }
    if (buffer.byteLength > MAX_APK_SIZE_BYTES) {
      return c.json({ error: `APK size exceeds ${Math.round(MAX_APK_SIZE_BYTES / (1024 * 1024))}MB limit` }, 400);
    }

    // Verify ZIP/APK magic header ("PK\x03\x04")
    const headerBytes = new Uint8Array(buffer.slice(0, 4));
    if (headerBytes[0] !== 0x50 || headerBytes[1] !== 0x4b) {
      return c.json({ error: 'Corrupt or invalid APK binary: Missing ZIP/APK magic signature' }, 400);
    }

    const checksum = await sha256Hex(buffer);
    const objectKey = `app-releases/${appType.toLowerCase()}/v${versionCode}-${versionName.replace(/[^a-zA-Z0-9._-]/g, '_')}-${Date.now()}.apk`;

    await c.env.MEDIA_BUCKET.put(objectKey, buffer, {
      httpMetadata: {
        contentType: 'application/vnd.android.package-archive'
      },
      customMetadata: {
        appType,
        versionName,
        versionCode: String(versionCode),
        sha256: checksum,
        uploadedBy: admin.email || admin.userId
      }
    });

    // Verify object integrity & size in R2
    const headObj = await c.env.MEDIA_BUCKET.head(objectKey);
    if (!headObj || headObj.size !== buffer.byteLength) {
      return c.json({ error: 'R2 storage verification failed: Uploaded size mismatch' }, 500);
    }

    // Always create as DRAFT (never auto-publish)
    const release = await prisma.appRelease.create({
      data: {
        appType,
        appName: APP_CATALOGUE_META[appType].appName,
        versionName,
        versionCode,
        releaseNotes,
        objectKey,
        fileSizeBytes: buffer.byteLength,
        sha256Checksum: checksum,
        minAndroidVersion,
        status: 'DRAFT',
        isLatest: false,
        visibility: visibility === 'INTERNAL' ? 'INTERNAL' : 'PUBLIC',
        uploadedBy: admin.email || admin.userId
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: admin.userId || admin.id,
        action: 'APP_RELEASE_UPLOADED',
        resourceType: 'AppRelease',
        resourceId: release.id,
        detailsJson: JSON.stringify({ appType, versionName, versionCode, fileSizeBytes: buffer.byteLength, checksum })
      }
    });

    return c.json({ message: 'APK uploaded to R2 as DRAFT', release }, 201);
  } catch (err: any) {
    return c.json({ error: 'APK upload failed', message: err.message }, 500);
  }
});

// POST /api/admin/app-releases/multipart/start (Streamed R2 Multipart Upload for large APKs)
adminAppReleasesRouter.post('/multipart/start', async (c) => {
  const prisma = c.get('prisma');
  const admin = c.get('user')!;

  try {
    const body = await c.req.json();
    const appType = String(body.appType || '').toUpperCase() as ValidAppType;
    const versionName = String(body.versionName || '').trim();
    const versionCode = Number(body.versionCode);
    const fileName = String(body.fileName || '').trim();
    const fileSizeBytes = Number(body.fileSizeBytes || 0);

    if (!VALID_APP_TYPES.includes(appType)) {
      return c.json({ error: 'Valid appType is required' }, 400);
    }
    if (!versionName || !Number.isInteger(versionCode) || versionCode < 1) {
      return c.json({ error: 'Valid versionName and integer versionCode (>= 1) are required' }, 400);
    }
    if (!fileName.toLowerCase().endsWith('.apk')) {
      return c.json({ error: 'Invalid file extension: Only .apk files are permitted' }, 400);
    }
    if (fileSizeBytes <= 0 || fileSizeBytes > MAX_APK_SIZE_BYTES) {
      return c.json({ error: `APK size must be between 1 byte and ${Math.round(MAX_APK_SIZE_BYTES / (1024 * 1024))}MB` }, 400);
    }

    const existing = await prisma.appRelease.findUnique({
      where: { appType_versionCode: { appType, versionCode } }
    });
    if (existing) {
      return c.json({ error: `Version code ${versionCode} already exists for ${appType}` }, 409);
    }

    const objectKey = `app-releases/${appType.toLowerCase()}/v${versionCode}-${versionName.replace(/[^a-zA-Z0-9._-]/g, '_')}-${Date.now()}.apk`;
    const mpu = await c.env.MEDIA_BUCKET.createMultipartUpload(objectKey, {
      httpMetadata: { contentType: 'application/vnd.android.package-archive' },
      customMetadata: {
        appType,
        versionName,
        versionCode: String(versionCode),
        uploadedBy: admin.email || admin.userId
      }
    });

    return c.json({ uploadId: mpu.uploadId, objectKey });
  } catch (err: any) {
    return c.json({ error: 'Failed to start multipart upload', message: err.message }, 500);
  }
});

// PUT /api/admin/app-releases/multipart/part
adminAppReleasesRouter.put('/multipart/part', async (c) => {
  try {
    const objectKey = c.req.query('objectKey') || '';
    const uploadId = c.req.query('uploadId') || '';
    const partNumber = Number(c.req.query('partNumber'));

    if (!objectKey.startsWith('app-releases/') || !uploadId || !Number.isInteger(partNumber) || partNumber < 1) {
      return c.json({ error: 'Invalid multipart parameters' }, 400);
    }
    if (!c.req.raw.body) {
      return c.json({ error: 'Empty part body' }, 400);
    }

    const mpu = c.env.MEDIA_BUCKET.resumeMultipartUpload(objectKey, uploadId);
    const uploadedPart = await mpu.uploadPart(partNumber, c.req.raw.body);

    return c.json({ partNumber: uploadedPart.partNumber, etag: uploadedPart.etag });
  } catch (err: any) {
    return c.json({ error: 'Failed to upload APK chunk', message: err.message }, 500);
  }
});

// POST /api/admin/app-releases/multipart/complete
adminAppReleasesRouter.post('/multipart/complete', async (c) => {
  const prisma = c.get('prisma');
  const admin = c.get('user')!;

  try {
    const body = await c.req.json();
    const {
      objectKey,
      uploadId,
      parts,
      appType: rawAppType,
      versionName,
      versionCode,
      releaseNotes,
      minAndroidVersion = '7.0 (API 24)',
      visibility = 'PUBLIC',
      sha256Checksum
    } = body;

    const appType = String(rawAppType || '').toUpperCase() as ValidAppType;
    if (!objectKey?.startsWith('app-releases/') || !uploadId || !Array.isArray(parts) || parts.length === 0) {
      return c.json({ error: 'Invalid multipart completion payload' }, 400);
    }

    const mpu = c.env.MEDIA_BUCKET.resumeMultipartUpload(objectKey, uploadId);
    await mpu.complete(parts);

    // Verify object integrity, size, and PK ZIP/APK header in R2
    const headObj = await c.env.MEDIA_BUCKET.head(objectKey);
    if (!headObj || headObj.size <= 0) {
      return c.json({ error: 'R2 object verification failed after upload' }, 500);
    }

    const headerSlice = await c.env.MEDIA_BUCKET.get(objectKey, { range: { offset: 0, length: 4 } });
    if (headerSlice) {
      const hBytes = new Uint8Array(await headerSlice.arrayBuffer());
      if (hBytes[0] !== 0x50 || hBytes[1] !== 0x4b) {
        await c.env.MEDIA_BUCKET.delete(objectKey).catch(() => null);
        return c.json({ error: 'Corrupt or invalid APK binary: Missing ZIP/APK magic signature' }, 400);
      }
    }

    const release = await prisma.appRelease.create({
      data: {
        appType,
        appName: APP_CATALOGUE_META[appType].appName,
        versionName: String(versionName).trim(),
        versionCode: Number(versionCode),
        releaseNotes: String(releaseNotes).trim(),
        objectKey,
        fileSizeBytes: headObj.size,
        sha256Checksum: sha256Checksum || null,
        minAndroidVersion: String(minAndroidVersion).trim(),
        status: 'DRAFT',
        isLatest: false,
        visibility: visibility === 'INTERNAL' ? 'INTERNAL' : 'PUBLIC',
        uploadedBy: admin.email || admin.userId
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: admin.userId || admin.id,
        action: 'APP_RELEASE_UPLOADED',
        resourceType: 'AppRelease',
        resourceId: release.id,
        detailsJson: JSON.stringify({ appType, versionName, versionCode, fileSizeBytes: headObj.size, sha256Checksum })
      }
    });

    return c.json({ message: 'APK uploaded to R2 as DRAFT', release }, 201);
  } catch (err: any) {
    return c.json({ error: 'Failed to complete multipart upload', message: err.message }, 500);
  }
});

// POST /api/admin/app-releases/:id/publish
adminAppReleasesRouter.post('/:id/publish', async (c) => {
  const prisma = c.get('prisma');
  const admin = c.get('user')!;
  const id = c.req.param('id');

  try {
    const body = await c.req.json().catch(() => ({}));
    const markAsLatest = body.markAsLatest !== false;

    const release = await prisma.appRelease.findUnique({ where: { id } });
    if (!release) return c.json({ error: 'App release not found' }, 404);

    if (markAsLatest) {
      await prisma.appRelease.updateMany({
        where: { appType: release.appType, isLatest: true },
        data: { isLatest: false }
      });
    }

    const updated = await prisma.appRelease.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        isLatest: markAsLatest,
        publishedAt: new Date()
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: admin.userId || admin.id,
        action: 'APP_RELEASE_PUBLISHED',
        resourceType: 'AppRelease',
        resourceId: id,
        detailsJson: JSON.stringify({ appType: release.appType, versionName: release.versionName, markAsLatest })
      }
    });

    return c.json({ message: 'Release published', release: updated });
  } catch (err: any) {
    return c.json({ error: 'Failed to publish release', message: err.message }, 500);
  }
});

// POST /api/admin/app-releases/:id/unpublish
adminAppReleasesRouter.post('/:id/unpublish', async (c) => {
  const prisma = c.get('prisma');
  const admin = c.get('user')!;
  const id = c.req.param('id');

  try {
    const release = await prisma.appRelease.findUnique({ where: { id } });
    if (!release) return c.json({ error: 'App release not found' }, 404);

    const updated = await prisma.appRelease.update({
      where: { id },
      data: {
        status: 'UNPUBLISHED',
        isLatest: false
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: admin.userId || admin.id,
        action: 'APP_RELEASE_UNPUBLISHED',
        resourceType: 'AppRelease',
        resourceId: id,
        detailsJson: JSON.stringify({ appType: release.appType, versionName: release.versionName })
      }
    });

    return c.json({ message: 'Release unpublished', release: updated });
  } catch (err: any) {
    return c.json({ error: 'Failed to unpublish release', message: err.message }, 500);
  }
});

// POST /api/admin/app-releases/:id/rollback
adminAppReleasesRouter.post('/:id/rollback', async (c) => {
  const prisma = c.get('prisma');
  const admin = c.get('user')!;
  const id = c.req.param('id');

  try {
    const release = await prisma.appRelease.findUnique({ where: { id } });
    if (!release) return c.json({ error: 'App release not found' }, 404);

    await prisma.appRelease.updateMany({
      where: { appType: release.appType, isLatest: true },
      data: { isLatest: false }
    });

    const updated = await prisma.appRelease.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        isLatest: true,
        publishedAt: release.publishedAt || new Date()
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: admin.userId || admin.id,
        action: 'APP_RELEASE_ROLLBACK',
        resourceType: 'AppRelease',
        resourceId: id,
        detailsJson: JSON.stringify({ appType: release.appType, versionName: release.versionName, versionCode: release.versionCode })
      }
    });

    return c.json({ message: 'Rolled back latest release', release: updated });
  } catch (err: any) {
    return c.json({ error: 'Rollback failed', message: err.message }, 500);
  }
});

// DELETE /api/admin/app-releases/:id
adminAppReleasesRouter.delete('/:id', async (c) => {
  const prisma = c.get('prisma');
  const admin = c.get('user')!;
  const id = c.req.param('id');

  try {
    const release = await prisma.appRelease.findUnique({ where: { id } });
    if (!release) return c.json({ error: 'App release not found' }, 404);

    if (release.status === 'PUBLISHED' && release.isLatest) {
      return c.json({ error: 'Cannot delete the active latest published release. Unpublish or roll back first.' }, 400);
    }

    await c.env.MEDIA_BUCKET.delete(release.objectKey).catch(() => null);
    await prisma.appRelease.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: admin.userId || admin.id,
        action: 'APP_RELEASE_DELETED',
        resourceType: 'AppRelease',
        resourceId: id,
        detailsJson: JSON.stringify({ appType: release.appType, versionName: release.versionName })
      }
    });

    return c.json({ message: 'Release deleted' });
  } catch (err: any) {
    return c.json({ error: 'Failed to delete release', message: err.message }, 500);
  }
});
