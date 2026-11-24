import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../server/src/index';
import { prisma } from '../server/src/db';

describe('Everything Local — Merchant Portal Authentication, Onboarding & Console Access', () => {
  let approvedMerchantToken: string;
  let customerToken: string;
  let adminToken: string;
  let newMerchantToken: string;
  let newStoreId: string;
  const uniqueId = Date.now();
  const newMerchantEmail = `merchant_${uniqueId}@everythinglocal.in`;
  const newMerchantPhone = `982${String(uniqueId).slice(-7)}`;

  beforeAll(async () => {
    // 1. Fetch Customer Token
    const custRes = await request(app)
      .post('/api/auth/login')
      .send({ emailOrPhone: 'ayush@example.com', password: 'Password@123' });
    customerToken = custRes.body.token;

    // 2. Fetch Admin Token
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ emailOrPhone: 'admin@everythinglocal.in', password: 'Password@123' });
    adminToken = adminRes.body.token;
  });

  it('Scenario 1: Approved merchant login returns 200, JWT token, MERCHANT role, and verified store details', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        emailOrPhone: 'sharma.kirana@everythinglocal.in',
        password: 'Password@123'
      });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toBeDefined();
    expect(res.body.user.role).toBe('MERCHANT');
    expect(res.body.user.email).toBe('sharma.kirana@everythinglocal.in');
    expect(res.body.user.store).toBeDefined();
    expect(res.body.user.store.name).toBe('Sharma Kirana Store');
    expect(res.body.user.store.isVerified).toBe(true);

    approvedMerchantToken = res.body.token;
  });

  it('Scenario 2: Invalid password for merchant returns 401 with informative error', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        emailOrPhone: 'sharma.kirana@everythinglocal.in',
        password: 'WrongPassword456'
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Invalid email\/phone or password/i);
  });

  it('Scenario 3: Non-existent merchant account returns 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        emailOrPhone: 'nonexistent.merchant@everythinglocal.in',
        password: 'Password@123'
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Invalid email\/phone or password/i);
  });

  it('Scenario 4: New merchant registers via /api/auth/register-merchant with business and owner details', async () => {
    const res = await request(app)
      .post('/api/auth/register-merchant')
      .send({
        name: 'Ramesh Patel',
        email: newMerchantEmail,
        phone: newMerchantPhone,
        password: 'Password@123',
        businessName: 'Patel Super Bazaar',
        category: 'Grocery & Daily Staples',
        addressLine: 'Shop 5, Sector B, Scheme 54',
        locality: 'Vijay Nagar',
        city: 'Indore',
        pincode: '452010',
        latitude: 22.7533,
        longitude: 75.8937
      });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('MERCHANT');
    expect(res.body.user.name).toBe('Ramesh Patel');
    expect(res.body.user.store).toBeDefined();
    expect(res.body.user.store.name).toBe('Patel Super Bazaar');

    newMerchantToken = res.body.token;
    newStoreId = res.body.user.store.id;
  });

  it('Scenario 5: Newly registered merchant store has isVerified = false (Pending Approval)', async () => {
    const store = await prisma.store.findUnique({
      where: { id: newStoreId }
    });

    expect(store).toBeDefined();
    expect(store?.isVerified).toBe(false);
  });

  it('Scenario 6: Pending merchant can check store status via GET /api/merchant/store and see isVerified = false', async () => {
    const res = await request(app)
      .get('/api/merchant/store')
      .set('Authorization', `Bearer ${newMerchantToken}`);

    expect(res.status).toBe(200);
    expect(res.body.store).toBeDefined();
    expect(res.body.store.id).toBe(newStoreId);
    expect(res.body.store.isVerified).toBe(false);
    expect(res.body.store.name).toBe('Patel Super Bazaar');
  });

  it('Scenario 7: Customer account is blocked with 403 when attempting to access merchant routes', async () => {
    const res = await request(app)
      .get('/api/merchant/store')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Forbidden/i);
  });

  it('Scenario 8: Admin verifies the new merchant store via POST /api/admin/merchants/:id/verify', async () => {
    const res = await request(app)
      .post(`/api/admin/merchants/${newStoreId}/verify`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        isVerified: true
      });

    expect(res.status).toBe(200);
    expect(res.body.store.isVerified).toBe(true);

    // Verify in database
    const dbStore = await prisma.store.findUnique({ where: { id: newStoreId } });
    expect(dbStore?.isVerified).toBe(true);
  });

  it('Scenario 9: Verified merchant can access catalogue and add product', async () => {
    // 1. Fetch products
    const listRes = await request(app)
      .get('/api/merchant/products')
      .set('Authorization', `Bearer ${newMerchantToken}`);

    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body.products)).toBe(true);

    // 2. Add product
    const addRes = await request(app)
      .post('/api/merchant/products')
      .set('Authorization', `Bearer ${newMerchantToken}`)
      .send({
        name: 'Madhur Pure & Hygienic Sugar',
        description: 'Refined sulphurless sugar 1 kg pack',
        category: 'Grocery & Daily Staples',
        mrpPaise: 6000,
        pricePaise: 4800,
        stock: 50,
        isAvailable: true,
        packageSize: '1 kg',
        brand: 'Madhur',
        barcode: '8901234567890'
      });

    expect(addRes.status).toBe(201);
    expect(addRes.body.product.name).toBe('Madhur Pure & Hygienic Sugar');
    expect(addRes.body.product.storeId).toBe(newStoreId);
  });

  it('Scenario 10: Merchant can log out and re-login successfully with phone number', async () => {
    // Sign in using registered phone number instead of email
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        emailOrPhone: newMerchantPhone,
        password: 'Password@123'
      });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('MERCHANT');
    expect(res.body.user.phone).toBe(newMerchantPhone);
    expect(res.body.user.store.isVerified).toBe(true); // Now verified!
  });
});
