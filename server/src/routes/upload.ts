import { Router, Request, Response } from 'express';
import multer from 'multer';
import { authenticateToken } from '../middleware/auth';
import { uploadImage } from '../core/storage';

const router = Router();

// Approved MIME types
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

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

      try {
        const protocol = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'http';
        const host = req.get('host') || 'localhost:4000';

        const result = await uploadImage({
          buffer: req.file.buffer,
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
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

    const protocol = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'http';
    const host = req.get('host') || 'localhost:4000';

    const result = await uploadImage({
      buffer,
      originalName: `cat-${Date.now()}${ext}`,
      mimeType: cleanMime,
      reqHost: host,
      reqProtocol: protocol
    });

    res.status(201).json({
      success: true,
      url: result.url,
      filename: result.key,
      mimetype: cleanMime,
      size: result.size,
      sourceUrl: url,
      provider: result.provider
    });
  } catch (error: any) {
    console.error('[Upload] Ingest image error:', error);
    res.status(500).json({ error: error.message || 'Failed to ingest external image' });
  }
});

export default router;
