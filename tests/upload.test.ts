import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../server/src/index';
import { generateToken } from '../server/src/middleware/auth';

describe('Image Storage & Upload Service', () => {
  const merchantToken = generateToken({
    userId: 'merchant-test-user',
    email: 'merchant@test.com',
    role: 'MERCHANT',
    storeId: 'store-test-1'
  });

  it('rejects unauthenticated upload requests with HTTP 401', async () => {
    const res = await request(app)
      .post('/api/upload/image')
      .attach('image', Buffer.from('fake image content'), 'test.jpg');

    expect(res.status).toBe(401);
  });

  it('successfully uploads valid JPEG image and returns permanent URL', async () => {
    // 1x1 transparent JPEG minimal header
    const jpegBuffer = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
      0x00, 0x03, 0x02, 0x02, 0x03, 0x02, 0x02, 0x03, 0xff, 0xd9
    ]);

    const res = await request(app)
      .post('/api/upload/image')
      .set('Authorization', `Bearer ${merchantToken}`)
      .attach('image', jpegBuffer, 'product-sample.jpg');

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.url).toMatch(/^http:\/\/.*\/uploads\/img-/);
    expect(res.body.filename).toBeDefined();
    expect(res.body.mimetype).toBe('image/jpeg');
  });

  it('rejects invalid file MIME type with HTTP 400', async () => {
    const textBuffer = Buffer.from('console.log("malicious code");');

    const res = await request(app)
      .post('/api/upload/image')
      .set('Authorization', `Bearer ${merchantToken}`)
      .attach('image', textBuffer, 'malicious.js');

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid file type');
  });

  it('rejects ingest-url requests without valid URL with HTTP 400', async () => {
    const res = await request(app)
      .post('/api/upload/ingest-url')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({ url: 'not-a-valid-url' });

    expect(res.status).toBe(400);
  });
});
