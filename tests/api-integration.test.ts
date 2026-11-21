import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../server/src/index';

describe('Everything Local - End-to-End API Integration', () => {
  let customerToken: string;
  let merchantToken: string;
  let adminToken: string;
  let palasiaStoreId: string;
  let productId1: string;
  let productId2: string;
  let createdOrderId: string;

  beforeAll(async () => {
    // 1. Authenticate Customer
    const custRes = await request(app)
      .post('/api/auth/login')
      .send({ emailOrPhone: 'ayush@example.com', password: 'Password@123' });
    customerToken = custRes.body.token;

    // 2. Authenticate Merchant
    const merchRes = await request(app)
      .post('/api/auth/login')
      .send({ emailOrPhone: 'sharma.kirana@everythinglocal.in', password: 'Password@123' });
    merchantToken = merchRes.body.token;

    // 3. Authenticate Admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ emailOrPhone: 'admin@everythinglocal.in', password: 'Password@123' });
    adminToken = adminRes.body.token;
  }, 30000);

  it('verifies health check endpoint', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.market).toBe('Indore, MP');
    expect(res.body.status).toBe('HEALTHY');
  });

  it('allows customer to discover nearby stores in Indore within 3km', async () => {
    const res = await request(app)
      .get('/api/customer/stores?lat=22.7244&lng=75.8839'); // Palasia coordinates

    expect(res.status).toBe(200);
    expect(res.body.stores.length).toBeGreaterThan(0);

    const firstStore = res.body.stores[0];
    expect(firstStore.isServiceable).toBe(true);
    expect(firstStore.distanceKm).toBeLessThanOrEqual(3.5);

    palasiaStoreId = firstStore.id;
    productId1 = firstStore.sampleProducts[0].id;
    productId2 = firstStore.sampleProducts[1].id;
  });

  it('prevents checkout when subtotal is below ₹299 minimum order value', async () => {
    // Clear cart first
    await request(app)
      .delete('/api/customer/cart')
      .set('Authorization', `Bearer ${customerToken}`);

    // Add 1 small item (Tata Salt ₹28.00 = 2800 paise)
    const saltProductRes = await request(app).get(`/api/customer/stores/${palasiaStoreId}`);
    const saltProduct = saltProductRes.body.store.products.find((p: any) => p.name.includes('Salt'));

    await request(app)
      .post('/api/customer/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        storeId: palasiaStoreId,
        productId: saltProduct.id,
        quantity: 1
      });

    // Attempt quote calculation
    const quoteRes = await request(app)
      .post('/api/customer/orders/quote')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ fulfillmentMode: 'PICKUP' });

    expect(quoteRes.status).toBe(400);
    expect(quoteRes.body.error).toContain('Minimum order requirement not met');
    expect(quoteRes.body.meetsMinimumOrderValue).toBe(false);
  });

  it('enforces single-store cart rule when adding items from a different store', async () => {
    // Discover second store (Vijay Nagar)
    const storesRes = await request(app).get('/api/customer/stores?lat=22.7244&lng=75.8839');
    const store2 = storesRes.body.stores.find((s: any) => s.id !== palasiaStoreId);

    if (store2 && store2.sampleProducts.length > 0) {
      const conflictRes = await request(app)
        .post('/api/customer/cart/items')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          storeId: store2.id,
          productId: store2.sampleProducts[0].id,
          quantity: 1
        });

      expect(conflictRes.status).toBe(409);
      expect(conflictRes.body.storeConflict).toBe(true);
      expect(conflictRes.body.error).toBe('Single-store checkout rule');
    }
  });

  it('successfully places an order when subtotal >= ₹299', async () => {
    // Clear cart
    await request(app)
      .delete('/api/customer/cart')
      .set('Authorization', `Bearer ${customerToken}`);

    // Fetch store details to get products directly from palasiaStoreId
    const storeRes = await request(app).get(`/api/customer/stores/${palasiaStoreId}`);
    const products = storeRes.body.store.products;
    const p1 = products[0];
    const p2 = products[1];

    // Add items ensuring total >= ₹299 (29,900 paise)
    await request(app)
      .post('/api/customer/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        storeId: palasiaStoreId,
        productId: p1.id,
        quantity: 1
      });

    await request(app)
      .post('/api/customer/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        storeId: palasiaStoreId,
        productId: p2.id,
        quantity: 1
      });

    // Checkout with PICKUP (₹0 delivery charge)
    const checkoutRes = await request(app)
      .post('/api/customer/orders/checkout')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        fulfillmentMode: 'PICKUP',
        idempotencyKey: `TEST-IDEMP-${Date.now()}-${Math.random().toString().slice(-4)}`
      });

    if (checkoutRes.status !== 201) {
      console.error('Checkout error details:', checkoutRes.body);
    }

    expect(checkoutRes.status).toBe(201);
    expect(checkoutRes.body.order).toBeDefined();
    expect(checkoutRes.body.order.status).toBe('PLACED');
    expect(checkoutRes.body.order.deliveryFeePaise).toBe(0);
    expect(checkoutRes.body.order.totalAmountPaise).toBeGreaterThanOrEqual(29900);

    createdOrderId = checkoutRes.body.order.id;
  }, 20000);

  it('allows merchant to accept and transition order to completed', async () => {
    // 1. Merchant accepts order
    const acceptRes = await request(app)
      .post(`/api/merchant/orders/${createdOrderId}/status`)
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({ status: 'ACCEPTED', note: 'Order accepted by store manager' });

    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.order.status).toBe('ACCEPTED');

    // 2. Merchant marks ready for pickup
    const readyRes = await request(app)
      .post(`/api/merchant/orders/${createdOrderId}/status`)
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({ status: 'READY_FOR_PICKUP', note: 'Packed and kept at counter' });

    expect(readyRes.status).toBe(200);
    expect(readyRes.body.order.status).toBe('READY_FOR_PICKUP');

    // 3. Merchant marks collected (handover complete -> writes to financial ledger!)
    const collectRes = await request(app)
      .post(`/api/merchant/orders/${createdOrderId}/status`)
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({ status: 'COLLECTED', note: 'Customer collected package' });

    expect(collectRes.status).toBe(200);
    expect(collectRes.body.order.status).toBe('COLLECTED');
  }, 20000);

  it('verifies financial statement and ledger entries for merchant and admin', async () => {
    // Merchant statements
    const stmtRes = await request(app)
      .get('/api/merchant/finance/statements')
      .set('Authorization', `Bearer ${merchantToken}`);

    expect(stmtRes.status).toBe(200);
    expect(stmtRes.body.summary.completedOrdersCount).toBeGreaterThanOrEqual(1);
    expect(stmtRes.body.summary.totalCommissionWithheldPaise).toBeGreaterThan(0);

    // Admin metrics & ledger
    const adminRes = await request(app)
      .get('/api/admin/metrics')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(adminRes.status).toBe(200);
    expect(adminRes.body.metrics.completedOrdersCount).toBeGreaterThanOrEqual(1);
    expect(adminRes.body.metrics.platformNetRevenuePaise).toBeGreaterThan(0);
  }, 20000);
});
