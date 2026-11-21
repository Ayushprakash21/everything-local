import { Platform } from 'react-native';
import { request } from '../api/client';

export interface UploadResult {
  success: boolean;
  url: string;
  filename: string;
  mimetype?: string;
  size?: number;
}

/**
 * Uploads a local device image (camera capture or gallery pick) to the Everything Local storage service.
 * Supports iOS, Android, and Web platforms.
 * Returns the permanent HTTPS/HTTP image URL.
 */
export async function uploadProductImage(localUri: string): Promise<string> {
  const formData = new FormData();

  if (Platform.OS === 'web') {
    // On web, fetch local blob/data URL and append
    const blobResponse = await fetch(localUri);
    const blob = await blobResponse.blob();
    const ext = blob.type.split('/')[1] || 'jpg';
    formData.append('image', blob, `product-${Date.now()}.${ext}`);
  } else {
    // Native iOS and Android file handling
    const filename = localUri.split('/').pop() || `photo-${Date.now()}.jpg`;
    const match = /\.(\w+)$/.exec(filename);
    const ext = match ? match[1].toLowerCase() : 'jpg';
    const type = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

    formData.append('image', {
      uri: Platform.OS === 'android' ? localUri : localUri.replace('file://', ''),
      name: filename,
      type
    } as any);
  }

  const response = await request<UploadResult>('/upload/image', {
    method: 'POST',
    body: formData
  });

  if (!response || !response.url) {
    throw new Error('Image upload failed: no permanent URL returned');
  }

  return response.url;
}

/**
 * Ingests and persists an external catalogue image into our own storage infrastructure.
 */
export async function ingestCatalogueImageUrl(sourceUrl: string): Promise<string> {
  const response = await request<UploadResult>('/upload/ingest-url', {
    method: 'POST',
    body: JSON.stringify({ url: sourceUrl })
  });

  return response.url;
}
