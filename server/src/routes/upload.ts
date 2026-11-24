import { Router, Request, Response } from 'express';
import multer from 'multer';
import dns from 'dns/promises';
import { authenticateToken } from '../middleware/auth';
import { uploadImage } from '../core/storage';

const router = Router();

// Approved MIME types
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * P0 Security: Magic Bytes validation to prevent file spoofing
 */
export function detectImageMagicBytes(buffer: Buffer): 'image/jpeg' | 'image/png' | 'image/webp' | null {
  if (!buffer || buffer.length < 12) return null;
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }
  // WebP: RIFF (bytes 0-3) ... WEBP (bytes 8-11)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'image/webp';
  }
  return null;
}

/**
 * P0 Security: SSRF Protection
 * Rejects private, reserved, loopback, link-local and cloud-metadata addresses
 */
export function isPrivateOrReservedIP(ip: string): boolean {
  // Normalize IPv4-mapped IPv6 (e.g. ::ffff:127.0.0.1)
  let cleanIp = ip.toLowerCase();
  if (cleanIp.startsWith('::ffff:')) {
    cleanIp = cleanIp.slice(7);
  }

  // IPv6 checks
  if (cleanIp.includes(':')) {
    if (cleanIp === '::1' || cleanIp === '::') return true;
    if (cleanIp.startsWith('fe80:') || cleanIp.startsWith('fe8') || cleanIp.startsWith('fe9') || cleanIp.startsWith('fea') || cleanIp.startsWith('feb')) return true; // Link-local
    if (cleanIp.startsWith('fc') || cleanIp.startsWith('fd')) return true; // Unique local
    return false;
  }

  // IPv4 checks
  const parts = cleanIp.split('.').map((p) => parseInt(p, 10));
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return true; // Treat malformed IPs as unsafe
  }

  const [p0, p1] = parts;

  // 127.0.0.0/8 (Loopback)
  if (p0 === 127) return true;
  // 10.0.0.0/8 (Private)
  if (p0 === 10) return true;
  // 172.16.0.0/12 (Private: 172.16 - 172.31)
  if (p0 === 172 && p1 >= 16 && p1 <= 31) return true;
  // 192.168.0.0/16 (Private)
  if (p0 === 192 && p1 === 168) return true;
  // 169.254.0.0/16 (Link-local & AWS/GCP/Azure Metadata 169.254.169.254)
  if (p0 === 169 && p1 === 254) return true;
  // 0.0.0.0/8 (Current network)
  if (p0 === 0) return true;
  // 100.64.0.0/10 (Carrier-grade NAT)
  if (p0 === 100 && p1 >= 64 && p1 <= 127) return true;

  return false;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Only JPEG, PNG, and WebP are allowed.`));
    }
  }
});

/**
 * POST /api/upload/image
 * Multipart/form-data upload for merchant & customer photos
 */
router.post(
  '/image',
  authenticateToken,
  (req: Request, res: Response): void => {
    upload.single('image')(req, res, async (err: any) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          res.status(400).json({ error: 'File too large. Maximum allowed size is 5MB.' });
          return;
        }
        res.status(400).json({ error: `Upload error: ${err.message}` });
        return;
      } else if (err) {
        res.status(400).json({ error: err.message || 'File upload failed' });
        return;
      }

      if (!req.file || !req.file.buffer) {
        res.status(400).json({ error: 'No image file provided. Form field name must be "image".' });
        return;
      }

      // P0 Security: Validate actual binary magic bytes
      const detectedMime = detectImageMagicBytes(req.file.buffer);
      if (!detectedMime) {
        res.status(400).json({
          error: 'Invalid file signature: Content does not match valid JPEG, PNG, or WebP binary headers'
        });
        return;
      }

      try {
        const protocol = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'http';
        const host = req.get('host') || 'localhost:4000';

        const result = await uploadImage({
          buffer: req.file.buffer,
          originalName: req.file.originalname,
          mimeType: detectedMime,
          reqHost: host,
          reqProtocol: protocol
        });

        res.status(201).json({
          success: true,
          url: result.url,
          filename: result.key,
          mimetype: result.mimeType,
          size: result.size,
          provider: result.provider
        });
      } catch (uploadErr: any) {
        console.error('[Upload] Image storage error:', uploadErr);
        res.status(500).json({ error: uploadErr.message || 'Failed to persist uploaded image' });
      }
    });
  }
);

/**
 * POST /api/upload/ingest-url
 * Securely ingests an external catalogue image into our own storage infrastructure
 * Protected with DNS resolution and SSRF defense
 */
router.post('/ingest-url', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string' || !/^https?:\/\//i.test(url)) {
      res.status(400).json({ error: 'Valid HTTPS or HTTP image URL is required' });
      return;
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      res.status(400).json({ error: 'Malformed URL provided' });
      return;
    }

    // SSRF Check 1: Block localhost, metadata keywords, and raw private IP strings
    const hostname = parsedUrl.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname.includes('169.254.169.254') ||
      hostname.includes('metadata.google') ||
      hostname.includes('instance-data')
    ) {
      res.status(400).json({ error: 'SSRF blocked: Access to localhost or metadata services is forbidden' });
      return;
    }

    // SSRF Check 2: DNS Resolution verification
    try {
      const addresses = await dns.lookup(hostname, { all: true });
      if (!addresses || addresses.length === 0) {
        res.status(400).json({ error: `Cannot resolve hostname: ${hostname}` });
        return;
      }

      for (const record of addresses) {
        if (isPrivateOrReservedIP(record.address)) {
          res.status(400).json({
            error: `SSRF blocked: Destination address ${record.address} belongs to a private or reserved network range.`
          });
          return;
        }
      }
    } catch (dnsErr: any) {
      res.status(400).json({ error: `DNS lookup failed for ${hostname}: ${dnsErr.message}` });
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'error', // P0 Security: Do not follow arbitrary redirects to internal services
      headers: {
        'User-Agent': 'EverythingLocal/1.0.0 (ImageIngest)'
      }
    });
    clearTimeout(timeout);

    if (!response.ok) {
      res.status(400).json({ error: `Failed to fetch image from source: HTTP ${response.status}` });
      return;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length > MAX_FILE_SIZE_BYTES) {
      res.status(400).json({ error: 'Source image exceeds maximum 5MB size limit' });
      return;
    }

    // P0 Security: Inspect actual binary magic bytes
    const detectedMime = detectImageMagicBytes(buffer);
    if (!detectedMime) {
      res.status(400).json({
        error: 'Invalid file signature: Content does not match valid JPEG, PNG, or WebP binary headers'
      });
      return;
    }

    let ext = '.jpg';
    if (detectedMime === 'image/png') ext = '.png';
    else if (detectedMime === 'image/webp') ext = '.webp';

    const protocol = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'http';
    const host = req.get('host') || 'localhost:4000';

    const result = await uploadImage({
      buffer,
      originalName: `cat-${Date.now()}${ext}`,
      mimeType: detectedMime,
      reqHost: host,
      reqProtocol: protocol
    });

    res.status(201).json({
      success: true,
      url: result.url,
      filename: result.key,
      mimetype: detectedMime,
      size: result.size,
      sourceUrl: url,
      provider: result.provider
    });
  } catch (error: any) {
    if (error.name === 'AbortError') {
      res.status(408).json({ error: 'Image download timed out after 6 seconds' });
      return;
    }
    console.error('[Upload] Ingest image error:', error);
    res.status(500).json({ error: error.message || 'Failed to ingest external image' });
  }
});

export default router;
