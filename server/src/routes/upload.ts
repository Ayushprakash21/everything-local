import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Ensure uploads directory exists
const UPLOADS_DIR = path.resolve(__dirname, '../../../uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Approved MIME types
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) ? ext : '.jpg';
    const uniqueName = `img-${Date.now()}-${crypto.randomBytes(8).toString('hex')}${safeExt}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
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

function getAbsoluteUrl(req: Request, filename: string): string {
  // Respect forwarded headers or host
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.get('host') || 'localhost:4000';
  return `${protocol}://${host}/uploads/${filename}`;
}

/**
 * POST /api/upload/image
 * Multipart/form-data upload for merchant & customer photos
 */
router.post(
  '/image',
  authenticateToken,
  (req: Request, res: Response): void => {
    upload.single('image')(req, res, (err: any) => {
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

      if (!req.file) {
        res.status(400).json({ error: 'No image file provided. Form field name must be "image".' });
        return;
      }

      const permanentUrl = getAbsoluteUrl(req, req.file.filename);

      res.status(201).json({
        success: true,
        url: permanentUrl,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size
      });
    });
  }
);

/**
 * POST /api/upload/ingest-url
 * Securely ingests an external catalogue image into our own storage
 */
router.post('/ingest-url', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string' || !/^https?:\/\//i.test(url)) {
      res.status(400).json({ error: 'Valid HTTPS or HTTP image URL is required' });
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'EverythingLocal/1.0.0 (ImageIngest)'
      }
    });
    clearTimeout(timeout);

    if (!response.ok) {
      res.status(400).json({ error: `Failed to fetch image from source: HTTP ${response.status}` });
      return;
    }

    const contentType = response.headers.get('content-type') || '';
    const cleanMime = contentType.split(';')[0].trim().toLowerCase();
    if (!ALLOWED_MIME_TYPES.has(cleanMime)) {
      res.status(400).json({ error: `Source image type "${cleanMime}" is not an approved image format (JPEG, PNG, WebP)` });
      return;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length > MAX_FILE_SIZE_BYTES) {
      res.status(400).json({ error: 'Source image exceeds maximum 5MB size limit' });
      return;
    }

    let ext = '.jpg';
    if (cleanMime === 'image/png') ext = '.png';
    else if (cleanMime === 'image/webp') ext = '.webp';

    const filename = `cat-${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    const filePath = path.join(UPLOADS_DIR, filename);

    fs.writeFileSync(filePath, buffer);

    const permanentUrl = getAbsoluteUrl(req, filename);

    res.status(201).json({
      success: true,
      url: permanentUrl,
      filename,
      mimetype: cleanMime,
      size: buffer.length,
      sourceUrl: url
    });
  } catch (error: any) {
    console.error('Ingest image error:', error);
    res.status(500).json({ error: error.message || 'Failed to ingest external image' });
  }
});

export default router;
