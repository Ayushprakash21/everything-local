import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../server/src/index';
import { generateToken, getJwtSecret } from '../server/src/middleware/auth';
import { isPrivateOrReservedIP, detectImageMagicBytes } from '../server/src/routes/upload';

describe('Sprint 1: Security Hotfix & Regression Test Suite', () => {
  const merchantToken = generateToken({
    userId: 'sec-merchant-1',
    email: 'sec-merchant@everythinglocal.test',
    role: 'MERCHANT'
  });

  describe('1. Privilege Escalation Defense in Registration', () => {
    it('strictly rejects unauthenticated registration with role: ADMIN (HTTP 403)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: `attacker-${Date.now()}@test.com`,
          name: 'Malicious Attacker',
          password: 'Password123!',
          role: 'ADMIN'
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Privilege escalation rejected');
    });

    it('allows valid CUSTOMER registration without administrative elevation', async () => {
      const email = `customer-sec-${Date.now()}@test.com`;
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email,
          name: 'Legit Customer',
          password: 'Password123!',
          role: 'CUSTOMER'
        });

      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe('CUSTOMER');
    });
  });

  describe('2. JWT Secret Production Hardening', () => {
    it('detects and enforces >= 32 char strong secret in production environment', () => {
      const originalEnv = process.env.NODE_ENV;
      const originalSecret = process.env.JWT_SECRET;

      try {
        process.env.NODE_ENV = 'production';
        process.env.JWT_SECRET = 'short';
        expect(() => getJwtSecret()).toThrow(/at least 32 characters/);

        delete process.env.JWT_SECRET;
        expect(() => getJwtSecret()).toThrow(/JWT_SECRET environment variable is required/);
      } finally {
        process.env.NODE_ENV = originalEnv;
        process.env.JWT_SECRET = originalSecret;
      }
    });
  });

  describe('3. CORS Policy Protection', () => {
    it('rejects unapproved external origin', async () => {
      const res = await request(app)
        .get('/api/health')
        .set('Origin', 'https://malicious-phishing-site.com');

      // Supertest returns 500 when CORS origin callback returns an Error
      expect(res.status === 500 || !res.headers['access-control-allow-origin']).toBe(true);
    });

    it('allows approved localhost development origin', async () => {
      const res = await request(app)
        .get('/api/health')
        .set('Origin', 'http://localhost:5173');

      expect(res.status).toBe(200);
      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    });
  });

  describe('4. SSRF Defense in Image Ingestion', () => {
    it('correctly classifies private, loopback, and metadata IPs as blocked', () => {
      expect(isPrivateOrReservedIP('127.0.0.1')).toBe(true);
      expect(isPrivateOrReservedIP('10.0.1.5')).toBe(true);
      expect(isPrivateOrReservedIP('172.16.0.1')).toBe(true);
      expect(isPrivateOrReservedIP('172.31.255.255')).toBe(true);
      expect(isPrivateOrReservedIP('192.168.1.1')).toBe(true);
      expect(isPrivateOrReservedIP('169.254.169.254')).toBe(true);
      expect(isPrivateOrReservedIP('::1')).toBe(true);
      expect(isPrivateOrReservedIP('fe80::1')).toBe(true);

      // Public routable IPs should not be blocked
      expect(isPrivateOrReservedIP('8.8.8.8')).toBe(false);
      expect(isPrivateOrReservedIP('142.250.190.46')).toBe(false);
    });

    it('blocks loopback/localhost requests to internal health endpoint', async () => {
      const res = await request(app)
        .post('/api/upload/ingest-url')
        .set('Authorization', `Bearer ${merchantToken}`)
        .send({ url: 'http://localhost:4000/api/health' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('SSRF blocked');
    });

    it('blocks cloud metadata endpoint requests', async () => {
      const res = await request(app)
        .post('/api/upload/ingest-url')
        .set('Authorization', `Bearer ${merchantToken}`)
        .send({ url: 'http://169.254.169.254/latest/meta-data/' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('SSRF blocked');
    });
  });

  describe('5. Magic Bytes Binary Image Validation', () => {
    it('detects valid JPEG, PNG, and WebP signatures', () => {
      const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
      const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
      const webp = Buffer.from([0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]);

      expect(detectImageMagicBytes(jpeg)).toBe('image/jpeg');
      expect(detectImageMagicBytes(png)).toBe('image/png');
      expect(detectImageMagicBytes(webp)).toBe('image/webp');
    });

    it('rejects text content renamed as .jpg (mime spoofing attack)', async () => {
      const textBuffer = Buffer.from('<?php echo "evil payload"; ?>');

      const res = await request(app)
        .post('/api/upload/image')
        .set('Authorization', `Bearer ${merchantToken}`)
        .attach('image', textBuffer, 'innocent-looking.jpg');

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid file signature');
    });
  });
});
