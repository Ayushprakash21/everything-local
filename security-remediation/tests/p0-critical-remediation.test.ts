import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';
import app from '../../server/src/index';
import { prisma } from '../../server/src/db';
import { MultiStoreOrderEngine } from '../../server/src/core/multiStoreOrderEngine';
import { getJwtSecret } from '../../server/src/middleware/auth';
import { authMiddleware } from '../../server/src/worker';

describe('Phase P0: Critical Vulnerability Security Remediation Tests', () => {
  let customerToken: string;
  let customerId: string;
  let adminToken: string;
  let testStore: any;
  let testProduct: any;

  const LEAKED_DEFAULT_SECRET = 'everything_local_indore_jwt_prod_key_2026_secured_cf';

  beforeAll(async () => {
    // 1. Authenticate Customer
    const custRes = await request(app)
      .post('/api/auth/login')
      .send({ emailOrPhone: 'ayush@example.com', password: 'Password@123' });
    expect(custRes.status).toBe(200);
    customerToken = custRes.body.token;
    customerId = custRes.body.user.id;

    // 2. Authenticate Admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ emailOrPhone: 'admin@everythinglocal.in', password: 'Password@123' });
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.token;

    // 3. Find or create a test store and product for pricing tests
    testStore = await prisma.store.findFirst({
      where: { isVerified: true },
      include: { products: true }
    });

    if (!testStore || testStore.products.length === 0) {
      // Find any store or create one
      testStore = await prisma.store.findFirst();
      testProduct = await prisma.product.create({
        data: {
          storeId: testStore.id,
          name: 'Security Test Premium Item',
          description: 'High value product for pricing exploit verification',
          pricePaise: 50000, // ₹500.00
          stockQuantity: 100,
          isAvailable: true,
          category: 'Grocery'
        }
      });
    } else {
      testProduct = testStore.products[0];
    }
  });

  // =========================================================================
  // VULN-001: Client-Controlled Product Pricing & Sub-Paisa Manipulation
  // =========================================================================
  describe('VULN-001: Client-Controlled Product Pricing & Sub-Paisa Manipulation', () => {
    it('1.1: MultiStoreOrderEngine rejects / overrides client-controlled unitPricePaise with canonical DB price', async () => {
      const canonicalPrice = testProduct.pricePaise;
      expect(canonicalPrice).toBeGreaterThan(0);

      // Malicious payload: Attacker claims unitPricePaise is 1 paisa (₹0.01)
      const tamperedPricePaise = 1;

      const orderResult = await MultiStoreOrderEngine.checkout({
        customerId,
        deliveryAddress: 'Palasia, Indore',
        deliveryLatitude: 22.7244,
        deliveryLongitude: 75.8839,
        deliveryTier: 'STANDARD_60',
        deliveryNotes: 'Price manipulation regression test',
        paymentMethod: 'ONLINE',
        items: [
          {
            storeId: testStore.id,
            productId: testProduct.id,
            productName: testProduct.name,
            quantity: 2,
            unitPricePaise: tamperedPricePaise // Attacker supplies 1 paisa
          }
        ]
      });

      expect(orderResult).toBeDefined();
      expect(orderResult.parentOrder).toBeDefined();

      // Find the child order item
      const childOrder = orderResult.childOrders[0];
      expect(childOrder).toBeDefined();
      const orderItem = childOrder.items[0];

      // CRITICAL ASSERTION: The price charged MUST be canonical DB price, NOT attacker's 1 paisa
      expect(orderItem.unitPricePaise).toBe(canonicalPrice);
      expect(orderItem.totalPricePaise).toBe(canonicalPrice * 2);
      expect(childOrder.subtotalPaise).toBe(canonicalPrice * 2);
    });

    it('1.2: MultiStoreOrderEngine strictly rejects invalid, negative, and decimal quantities', async () => {
      // Negative quantity exploit attempt
      await expect(
        MultiStoreOrderEngine.checkout({
          customerId,
          deliveryAddress: 'Palasia, Indore',
          deliveryLatitude: 22.7244,
          deliveryLongitude: 75.8839,
          deliveryTier: 'STANDARD_60',
          paymentMethod: 'ONLINE',
          items: [
            {
              storeId: testStore.id,
              productId: testProduct.id,
              quantity: -5,
              unitPricePaise: 5000
            }
          ]
        })
      ).rejects.toThrow(/positive integer/i);

      // Zero quantity exploit attempt
      await expect(
        MultiStoreOrderEngine.checkout({
          customerId,
          deliveryAddress: 'Palasia, Indore',
          deliveryLatitude: 22.7244,
          deliveryLongitude: 75.8839,
          deliveryTier: 'STANDARD_60',
          paymentMethod: 'ONLINE',
          items: [
            {
              storeId: testStore.id,
              productId: testProduct.id,
              quantity: 0,
              unitPricePaise: 5000
            }
          ]
        })
      ).rejects.toThrow(/positive integer/i);

      // Decimal quantity exploit attempt
      await expect(
        MultiStoreOrderEngine.checkout({
          customerId,
          deliveryAddress: 'Palasia, Indore',
          deliveryLatitude: 22.7244,
          deliveryLongitude: 75.8839,
          deliveryTier: 'STANDARD_60',
          paymentMethod: 'ONLINE',
          items: [
            {
              storeId: testStore.id,
              productId: testProduct.id,
              quantity: 1.5,
              unitPricePaise: 5000
            }
          ]
        })
      ).rejects.toThrow(/positive integer/i);
    });

    it('1.3: Customer API checkout endpoint rejects non-integer or negative quantities via schema validation', async () => {
      // Attempt negative quantity
      const negRes = await request(app)
        .post('/api/customer/orders/multi-store')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          deliveryAddress: '123 Test St, Indore',
          deliveryLatitude: 22.7244,
          deliveryLongitude: 75.8839,
          deliveryTier: 'STANDARD_60',
          items: [
            {
              storeId: testStore.id,
              productId: testProduct.id,
              quantity: -2
            }
          ]
        });

      expect(negRes.status).toBe(400);
      expect(negRes.body.error).toMatch(/validation failed/i);

      // Attempt decimal quantity
      const decRes = await request(app)
        .post('/api/customer/orders/multi-store')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          deliveryAddress: '123 Test St, Indore',
          deliveryLatitude: 22.7244,
          deliveryLongitude: 75.8839,
          deliveryTier: 'STANDARD_60',
          items: [
            {
              storeId: testStore.id,
              productId: testProduct.id,
              quantity: 2.75
            }
          ]
        });

      expect(decRes.status).toBe(400);
      expect(decRes.body.error).toMatch(/validation failed/i);
    });
  });

  // =========================================================================
  // VULN-002: Hardcoded JWT Secret Fallback
  // =========================================================================
  describe('VULN-002: Hardcoded JWT Secret Fallback Remediation', () => {
    it('2.1: getJwtSecret() explicitly rejects the known compromised fallback secret', () => {
      const originalSecret = process.env.JWT_SECRET;
      try {
        process.env.JWT_SECRET = LEAKED_DEFAULT_SECRET;
        expect(() => getJwtSecret()).toThrow(/insecure or compromised/i);
      } finally {
        process.env.JWT_SECRET = originalSecret;
      }
    });

    it('2.2: getJwtSecret() rejects secrets shorter than 32 characters in production', () => {
      const originalSecret = process.env.JWT_SECRET;
      const originalEnv = process.env.NODE_ENV;
      try {
        process.env.NODE_ENV = 'production';
        process.env.JWT_SECRET = 'short_secret_key';
        expect(() => getJwtSecret()).toThrow(/at least 32 characters/i);
      } finally {
        process.env.JWT_SECRET = originalSecret;
        process.env.NODE_ENV = originalEnv;
      }
    });

    it('2.3: API rejects tokens forged with the leaked default secret', async () => {
      // Forge a forged JWT using the known leaked secret string
      const forgedToken = jwt.sign(
        { userId: customerId, role: 'ADMIN', email: 'forged_admin@everythinglocal.in' },
        LEAKED_DEFAULT_SECRET,
        { algorithm: 'HS256', expiresIn: '1h' }
      );

      // Attempt to access an authenticated endpoint with the forged token
      const res = await request(app)
        .get('/api/customer/cart')
        .set('Authorization', `Bearer ${forgedToken}`);

      // MUST be rejected with 401 or 403
      expect([401, 403]).toContain(res.status);
    });

    it('2.4: Cloudflare Worker authMiddleware fails closed when JWT_SECRET is compromised or missing', async () => {
      let statusCalled = 0;
      let jsonCalledWith: any = null;

      const mockContext = {
        req: {
          header: (name: string) => (name.toLowerCase() === 'authorization' ? `Bearer ${customerToken}` : undefined)
        },
        env: {
          JWT_SECRET: LEAKED_DEFAULT_SECRET
        },
        json: (body: any, status: number) => {
          statusCalled = status;
          jsonCalledWith = body;
          return { body, status };
        },
        set: () => {}
      };

      const nextFn = async () => {};

      await authMiddleware(mockContext as any, nextFn);
      expect(statusCalled).toBe(500);
      expect(jsonCalledWith?.error).toContain('Server authentication configuration error');
    });
  });

  // =========================================================================
  // VULN-003: Universal OTP Backdoor in Delivery Partner Auth
  // =========================================================================
  describe('VULN-003: Universal OTP Backdoor Remediation', () => {
    const partnerPhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;

    it('3.1: OTP cannot be replayed after successful verification (single-use enforcement)', async () => {
      // 1. Send OTP
      const sendRes = await request(app)
        .post('/api/delivery-partner/auth/send-otp')
        .send({ phone: partnerPhone });
      expect(sendRes.status).toBe(200);

      // 2. First verification (using test OTP in test environment)
      const firstVerify = await request(app)
        .post('/api/delivery-partner/auth/verify-otp')
        .send({ phone: partnerPhone, otp: '123456' });
      expect(firstVerify.status).toBe(200);
      expect(firstVerify.body.token).toBeDefined();

      // 3. Immediate second verification attempt with same OTP must FAIL
      // (OTP store must have deleted the token)
      // Temporarily simulate non-test mode to verify replay rejection
      const originalNodeEnv = process.env.NODE_ENV;
      try {
        process.env.NODE_ENV = 'production';
        const replayVerify = await request(app)
          .post('/api/delivery-partner/auth/verify-otp')
          .send({ phone: partnerPhone, otp: '123456' });

        expect(replayVerify.status).toBe(400);
        expect(replayVerify.body.error).toMatch(/invalid or expired otp/i);
      } finally {
        process.env.NODE_ENV = originalNodeEnv;
      }
    });

    it('3.2: Rejects arbitrary / incorrect OTP with 400', async () => {
      const res = await request(app)
        .post('/api/delivery-partner/auth/verify-otp')
        .send({ phone: partnerPhone, otp: '999999' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/invalid or expired otp/i);
    });

    it('3.3: In production mode, OTP 123456 is rejected without a matching stored OTP', async () => {
      const unseededPhone = `91${Math.floor(10000000 + Math.random() * 90000000)}`;
      const originalNodeEnv = process.env.NODE_ENV;

      try {
        process.env.NODE_ENV = 'production';
        const res = await request(app)
          .post('/api/delivery-partner/auth/verify-otp')
          .send({ phone: unseededPhone, otp: '123456' });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/invalid or expired otp/i);
      } finally {
        process.env.NODE_ENV = originalNodeEnv;
      }
    });
  });

  // =========================================================================
  // VULN-004: Arbitrary File Read / Path Traversal in Prescription Service
  // =========================================================================
  describe('VULN-004: Prescription Storage Path Traversal Remediation', () => {
    it('4.1: POST /api/pharmacy/prescriptions rejects directory traversal in storagePath (../)', async () => {
      const res = await request(app)
        .post('/api/pharmacy/prescriptions')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          patientName: 'Test Traversal Patient',
          patientAge: 35,
          patientGender: 'MALE',
          deliveryAddress: 'Palasia, Indore',
          documents: [
            {
              fileName: 'exploit.jpg',
              fileType: 'image/jpeg',
              fileSizeBytes: 1024,
              storagePath: '../../../../etc/passwd'
            }
          ]
        });

      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).toMatch(/(traversal|validation failed)/i);
    });

    it('4.2: POST /api/pharmacy/prescriptions rejects absolute paths in storagePath', async () => {
      const res = await request(app)
        .post('/api/pharmacy/prescriptions')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          patientName: 'Test Absolute Path Patient',
          patientAge: 40,
          patientGender: 'FEMALE',
          deliveryAddress: 'Palasia, Indore',
          documents: [
            {
              fileName: 'exploit.jpg',
              fileType: 'image/jpeg',
              fileSizeBytes: 1024,
              storagePath: '/etc/shadow'
            }
          ]
        });

      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).toMatch(/(traversal|validation failed|invalid storage path)/i);
    });

    it('4.3: POST /api/pharmacy/prescriptions rejects references to non-existent staged files', async () => {
      const fakeFilename = `fake_rx_${Date.now()}.jpg`;

      const res = await request(app)
        .post('/api/pharmacy/prescriptions')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          patientName: 'Unstaged File Patient',
          patientAge: 29,
          patientGender: 'OTHER',
          deliveryAddress: 'Palasia, Indore',
          documents: [
            {
              fileName: 'realname.jpg',
              fileType: 'image/jpeg',
              fileSizeBytes: 2048,
              storagePath: fakeFilename
            }
          ]
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/not found in secure staging/i);
    });

    it('4.4: Document view endpoint rejects attempts with malicious document IDs or non-existent files', async () => {
      const fakeRxId = 'rx-non-existent-123';
      const fakeDocId = 'doc-non-existent-456';

      const res = await request(app)
        .get(`/api/pharmacy/prescriptions/${fakeRxId}/documents/${fakeDocId}/view`)
        .set('Authorization', `Bearer ${customerToken}`);

      // Must return 404 (or 403), never 500 or file contents
      expect([403, 404]).toContain(res.status);
    });
  });
});
