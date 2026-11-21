/**
 * EVERYTHING LOCAL — PERSISTENT OBJECT STORAGE ADAPTER
 * Supports Cloudflare R2 (S3-compatible API), Cloudinary, and Persistent Server Storage
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface StorageUploadResult {
  url: string;
  key: string;
  provider: 'r2' | 'cloudinary' | 'local';
  size: number;
  mimeType: string;
}

// Ensure permanent uploads directory exists
const UPLOADS_DIR = path.resolve(__dirname, '../../../uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * AWS Signature Version 4 helper for Cloudflare R2 REST API.
 * Zero external dependencies — avoids Windows MAX_PATH tar extraction issues with AWS SDK.
 */
function createR2AuthorizationHeader(params: {
  method: string;
  endpoint: string;
  path: string;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  payloadHash: string;
  dateStr: string; // YYYYMMDD
  dateTimeStr: string; // YYYYMMDDTHHMMSSZ
  headers: Record<string, string>;
}): string {
  const { method, path: reqPath, accessKeyId, secretAccessKey, region, payloadHash, dateStr, dateTimeStr, headers } = params;

  // Canonical headers
  const sortedHeaderKeys = Object.keys(headers).map(k => k.toLowerCase()).sort();
  const canonicalHeaders = sortedHeaderKeys.map(k => `${k}:${headers[k].trim()}\n`).join('');
  const signedHeaders = sortedHeaderKeys.join(';');

  // Canonical request
  const canonicalRequest = [
    method,
    reqPath,
    '', // query string
    canonicalHeaders,
    signedHeaders,
    payloadHash
  ].join('\n');

  const hashedCanonicalRequest = crypto.createHash('sha256').update(canonicalRequest).digest('hex');

  // String to sign
  const credentialScope = `${dateStr}/${region}/s3/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    dateTimeStr,
    credentialScope,
    hashedCanonicalRequest
  ].join('\n');

  // Signature calculation
  const kDate = crypto.createHmac('sha256', `AWS4${secretAccessKey}`).update(dateStr).digest();
  const kRegion = crypto.createHmac('sha256', kDate).update(region).digest();
  const kService = crypto.createHmac('sha256', kRegion).update('s3').digest();
  const kSigning = crypto.createHmac('sha256', kService).update('aws4_request').digest();
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

  return `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
}

/**
 * Uploads a buffer to Cloudflare R2 bucket
 */
async function uploadToCloudflareR2(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<string> {
  const accountId = process.env.R2_ACCOUNT_ID!;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID!;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY!;
  const bucketName = process.env.R2_BUCKET_NAME!;
  const publicBaseUrl = (process.env.R2_PUBLIC_URL || `https://${bucketName}.${accountId}.r2.dev`).replace(/\/+$/, '');

  const host = `${accountId}.r2.cloudflarestorage.com`;
  const reqPath = `/${bucketName}/products/${filename}`;
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const dateTimeStr = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const payloadHash = crypto.createHash('sha256').update(buffer).digest('hex');

  const headers: Record<string, string> = {
    'content-type': mimeType,
    'host': host,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': dateTimeStr
  };

  const authHeader = createR2AuthorizationHeader({
    method: 'PUT',
    endpoint: host,
    path: reqPath,
    accessKeyId,
    secretAccessKey,
    region: 'auto',
    payloadHash,
    dateStr,
    dateTimeStr,
    headers
  });

  headers['authorization'] = authHeader;

  const url = `https://${host}${reqPath}`;
  const response = await fetch(url, {
    method: 'PUT',
    headers,
    body: new Uint8Array(buffer)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cloudflare R2 PUT failed with status ${response.status}: ${errorText}`);
  }

  return `${publicBaseUrl}/products/${filename}`;
}

/**
 * Uploads an image to the configured persistent storage provider:
 * 1. Cloudflare R2 (if R2 credentials configured)
 * 2. Persistent Local Storage with public network URL (guaranteed zero-downtime fallback)
 */
export async function uploadImage(params: {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  reqHost?: string;
  reqProtocol?: string;
}): Promise<StorageUploadResult> {
  const { buffer, originalName, mimeType, reqHost, reqProtocol } = params;

  // Generate unique collision-free filename
  const ext = path.extname(originalName).toLowerCase() || '.jpg';
  const safeExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) ? ext : '.jpg';
  const uniqueKey = `img-${Date.now()}-${crypto.randomBytes(8).toString('hex')}${safeExt}`;

  // 1. Check if Cloudflare R2 is configured
  if (
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME
  ) {
    try {
      const publicUrl = await uploadToCloudflareR2(buffer, uniqueKey, mimeType);
      return {
        url: publicUrl,
        key: uniqueKey,
        provider: 'r2',
        size: buffer.length,
        mimeType
      };
    } catch (r2Err: any) {
      console.error('[Storage] Cloudflare R2 upload failed, falling back to persistent local storage:', r2Err.message);
    }
  }

  // 2. Persistent Local Storage
  const filePath = path.join(UPLOADS_DIR, uniqueKey);
  fs.writeFileSync(filePath, buffer);

  // Compute public network-accessible URL
  // Priority: PUBLIC_URL > HOST_URL > EXPO_PUBLIC_API_URL origin > Request Host
  let baseUrl = '';
  if (process.env.PUBLIC_URL) {
    baseUrl = process.env.PUBLIC_URL.replace(/\/+$/, '');
  } else if (process.env.HOST_URL) {
    baseUrl = process.env.HOST_URL.replace(/\/+$/, '');
  } else if (process.env.EXPO_PUBLIC_API_URL) {
    // e.g. "https://api.everythinglocal.in/api" -> "https://api.everythinglocal.in"
    try {
      const parsed = new URL(process.env.EXPO_PUBLIC_API_URL);
      baseUrl = `${parsed.protocol}//${parsed.host}`;
    } catch {
      baseUrl = '';
    }
  }

  if (!baseUrl) {
    const protocol = reqProtocol || 'http';
    const host = reqHost || 'localhost:4000';
    baseUrl = `${protocol}://${host}`;
  }

  const permanentUrl = `${baseUrl}/uploads/${uniqueKey}`;

  return {
    url: permanentUrl,
    key: uniqueKey,
    provider: 'local',
    size: buffer.length,
    mimeType
  };
}
