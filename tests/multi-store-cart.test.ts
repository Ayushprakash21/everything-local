import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../server/src/index';
import { prisma } from '../server/src/db';
import { MultiStoreOrderEngine } from '../server/src/core/multiStoreOrderEngine';

describe('Everything Local — Unified Multi-Store Cart & Checkout Master Test Suite', () => {
  let customerToken: string;
  let customerId: string;
  let storeA: any;
  let storeB: any;
  let storeC: any;

  beforeAll(async () => {
    // 1. Login test customer
    const authRes = await request(app)
      .post('/api/auth/login')
      .send({ emailOrPhone: 'ayush@example.com', password: 'Password@123' });

    expect(authRes.status).toBe(200);
    customerToken = authRes.body.token;
    customerId = authRes.body.user.id;

    // 2. Fetch or identify at least 3 distinct active stores in Indore
    const storesRes = await request(app).get('/api/customer/stores?lat=22.7244&lng=75.8839');
    expect(storesRes.status).toBe(200);
    const stores = storesRes.body.stores;
    expect(stores.length).toBeGreaterThanOrEqual(3);

    // Fetch full storefront for candidate stores to get active products
    const storesWithProducts: any[] = [];
    for (const st of stores) {
      const s = await request(app).get(`/api/customer/stores/${st.id}`);
      if (s.body.store && s.body.store.products && s.body.store.products.length > 0) {
        storesWithProducts.push(s.body.store);
        if (storesWithProducts.length === 3) break;
      }
    }

    storeA = storesWithProducts[0];
    storeB = storesWithProducts[1];
    storeC = storesWithProducts[2];

    expect(storeA.products.length).toBeGreaterThanOrEqual(1);
    expect(storeB.products.length).toBeGreaterThanOrEqual(1);
    expect(storeC.products.length).toBeGreaterThanOrEqual(1);

    // Ensure test products have ample stock for tests
    await prisma.product.updateMany({
      where: {
        id: {
          in: [
            storeA.products[0].id,
            storeB.products[0].id,
            storeC.products[0].id
          ]
        }
      },
      data: {
        stock: 100,
        isAvailable: true
      }
    });

    // 3. Clear cart initially
    await request(app)
      .delete('/api/customer/cart')
      .set('Authorization', `Bearer ${customerToken}`);
  });

  // TEST 1: Add a product from Store A, Add a product from Store B -> Both remain in cart
  it('TEST 1: Allows adding products from Store A and Store B without single-store restriction', async () => {
    // Add from Store A
    const resA = await request(app)
      .post('/api/customer/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        storeId: storeA.id,
        productId: storeA.products[0].id,
        quantity: 2
      });
    expect(resA.status).toBe(200);
    expect(resA.body.cart.items.length).toBe(1);

    // Add from Store B
    const resB = await request(app)
      .post('/api/customer/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        storeId: storeB.id,
        productId: storeB.products[0].id,
        quantity: 1
      });

    // Must NOT return 409 single-store conflict!
    expect(resB.status).toBe(200);
    expect(resB.body.cart.items.length).toBe(2);

    const storeIds = resB.body.cart.items.map((i: any) => i.product.storeId);
    expect(storeIds).toContain(storeA.id);
    expect(storeIds).toContain(storeB.id);
  });

  // TEST 2: Add products from three different merchants -> All remain in one unified cart
  it('TEST 2: Allows adding products from 3 distinct merchants into one unified cart', async () => {
    // Add from Store C
    const resC = await request(app)
      .post('/api/customer/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        storeId: storeC.id,
        productId: storeC.products[0].id,
        quantity: 3
      });

    expect(resC.status).toBe(200);
    expect(resC.body.cart.items.length).toBe(3);

    const storeIds = resC.body.cart.items.map((i: any) => i.product.storeId);
    expect(storeIds).toContain(storeA.id);
    expect(storeIds).toContain(storeB.id);
    expect(storeIds).toContain(storeC.id);
  });

  // TEST 3: Browser refresh / fetch cart -> Cart contents remain available & persisted
  it('TEST 3: Persists cart across browser refresh or navigation (GET /customer/cart)', async () => {
    const fetchRes = await request(app)
      .get('/api/customer/cart')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(fetchRes.status).toBe(200);
    expect(fetchRes.body.cart.items.length).toBe(3);
    expect(fetchRes.body.distinctMerchantCount).toBe(3);
    expect(fetchRes.body.merchantBreakdowns.length).toBe(3);

    // Check that each merchant has its subtotal and itemCount
    const merchantNames = fetchRes.body.merchantBreakdowns.map((m: any) => m.merchantName);
    expect(merchantNames).toContain(storeA.name);
    expect(merchantNames).toContain(storeB.name);
    expect(merchantNames).toContain(storeC.name);
  });

  // TEST 4: Change merchants repeatedly -> No cart clearing and no single-store alert
  it('TEST 4: Browsing and alternating between stores preserves all cart items', async () => {
    // Browse Store A and update quantity
    const updateA = await request(app)
      .post('/api/customer/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        storeId: storeA.id,
        productId: storeA.products[0].id,
        quantity: 4
      });
    expect(updateA.status).toBe(200);

    // Browse Store B and add a second product if available or update quantity
    const updateB = await request(app)
      .post('/api/customer/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        storeId: storeB.id,
        productId: storeB.products[0].id,
        quantity: 2
      });
    expect(updateB.status).toBe(200);

    // Verify all 3 stores still exist in cart
    const finalCart = await request(app)
      .get('/api/customer/cart')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(finalCart.status).toBe(200);
    expect(finalCart.body.cart.items.length).toBe(3);
    const itemA = finalCart.body.cart.items.find((i: any) => i.productId === storeA.products[0].id);
    const itemB = finalCart.body.cart.items.find((i: any) => i.productId === storeB.products[0].id);
    expect(itemA.quantity).toBe(4);
    expect(itemB.quantity).toBe(2);
  });

  // TEST 5: One merchant rejects an item -> Other merchant orders remain intact
  it('TEST 5: Partial merchant rejection leaves remaining merchant orders completely intact', async () => {
    // Place a multi-store order
    const orderRes = await request(app)
      .post('/api/customer/orders/multi-store')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        deliveryPriorityTier: 'STANDARD_60',
        deliveryAddress: '502 Shekhar Central, Palasia, Indore',
        customerLat: 22.7244,
        customerLng: 75.8839,
        paymentMethod: 'ONLINE',
        items: [
          {
            productId: storeA.products[0].id,
            merchantId: storeA.id,
            productName: storeA.products[0].name,
            quantity: 1,
            unitPricePaise: storeA.products[0].pricePaise
          },
          {
            productId: storeB.products[0].id,
            merchantId: storeB.id,
            productName: storeB.products[0].name,
            quantity: 1,
            unitPricePaise: storeB.products[0].pricePaise
          }
        ]
      });

    expect(orderRes.status).toBe(201);
    const childOrders = orderRes.body.merchantChildOrders;
    expect(childOrders.length).toBe(2);

    const childA = childOrders.find((c: any) => c.storeId === storeA.id);
    const childB = childOrders.find((c: any) => c.storeId === storeB.id);

    // Merchant B rejects order
    const rejectionResult = await MultiStoreOrderEngine.handlePartialMerchantRejection(
      childB.id,
      'Item out of stock at store B'
    );

    // Verify Merchant B is marked REJECTED
    expect(rejectionResult.rejectedChildOrder.status).toBe('REJECTED');

    // Verify Merchant A is STILL PENDING_ACCEPTANCE / intact!
    const updatedChildA = await prisma.merchantChildOrder.findUnique({
      where: { id: childA.id }
    });
    expect(updatedChildA!.status).not.toBe('REJECTED');
    expect(updatedChildA!.parentOrderId).toBe(orderRes.body.parentOrder.id);
  });

  // TEST 6: One merchant has insufficient stock -> Only affected products are flagged
  it('TEST 6: Stock validation checks each merchant independently without removing unaffected items', async () => {
    // Populate cart with Store A and Store B products
    await request(app)
      .post('/api/customer/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ storeId: storeA.id, productId: storeA.products[0].id, quantity: 1 });

    await request(app)
      .post('/api/customer/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ storeId: storeB.id, productId: storeB.products[0].id, quantity: 1 });

    // Temporarily set Store B's product stock to 0 to simulate out-of-stock
    await prisma.product.update({
      where: { id: storeB.products[0].id },
      data: { isAvailable: false }
    });

    const validateRes = await request(app)
      .post('/api/customer/cart/validate')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(validateRes.status).toBe(200);
    expect(validateRes.body.unavailableCount).toBe(1);

    const itemA = validateRes.body.items.find((i: any) => i.productId === storeA.products[0].id);
    const itemB = validateRes.body.items.find((i: any) => i.productId === storeB.products[0].id);

    // Store A is still valid
    expect(itemA.isAvailable).toBe(true);
    // Only Store B is flagged as unavailable
    expect(itemB.isAvailable).toBe(false);
    expect(itemB.storeId).toBe(storeB.id);

    // Restore Store B availability
    await prisma.product.update({
      where: { id: storeB.products[0].id },
      data: { isAvailable: true }
    });
  });

  // TEST 7: Checkout across multiple merchants -> Creates one ParentOrder and independent ChildOrders
  it('TEST 7: Checkout across 3 merchants creates one ParentOrder and 3 independent MerchantChildOrders', async () => {
    // Add items from 3 stores
    await request(app)
      .delete('/api/customer/cart')
      .set('Authorization', `Bearer ${customerToken}`);

    await request(app)
      .post('/api/customer/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ storeId: storeA.id, productId: storeA.products[0].id, quantity: 2 });

    await request(app)
      .post('/api/customer/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ storeId: storeB.id, productId: storeB.products[0].id, quantity: 2 });

    await request(app)
      .post('/api/customer/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ storeId: storeC.id, productId: storeC.products[0].id, quantity: 1 });

    // Execute multi-store checkout
    const checkoutRes = await request(app)
      .post('/api/customer/orders/multi-store')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        deliveryPriorityTier: 'STANDARD_60',
        deliveryAddress: 'Scheme 54, Vijay Nagar, Indore',
        customerLat: 22.7533,
        customerLng: 75.8937,
        paymentMethod: 'ONLINE'
      });

    expect(checkoutRes.status).toBe(201);
    expect(checkoutRes.body.parentOrder).toBeDefined();
    expect(checkoutRes.body.merchantChildOrders.length).toBe(3);

    // Verify 3 distinct child orders with respective storeIds
    const childStoreIds = checkoutRes.body.merchantChildOrders.map((c: any) => c.storeId);
    expect(childStoreIds).toContain(storeA.id);
    expect(childStoreIds).toContain(storeB.id);
    expect(childStoreIds).toContain(storeC.id);

    // Verify cart was cleared after successful order
    const afterCart = await request(app)
      .get('/api/customer/cart')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(afterCart.body.cart.items.length).toBe(0);
  });

  // TEST 8: Delivery capacity check / logistics quotes -> 4 delivery priority tiers calculated
  it('TEST 8: Delivery logistics engine quotes all 4 tiers with extra multi-store stop charges', async () => {
    const quoteRes = await request(app)
      .post('/api/customer/delivery/quote')
      .send({
        storeIds: [storeA.id, storeB.id, storeC.id],
        customerLat: 22.7244,
        customerLng: 75.8839,
        items: [
          { storeId: storeA.id, quantity: 1, weightKg: 0.5 },
          { storeId: storeB.id, quantity: 1, weightKg: 0.5 },
          { storeId: storeC.id, quantity: 1, weightKg: 0.5 }
        ]
      });

    expect(quoteRes.status).toBe(200);
    expect(quoteRes.body.quotes.length).toBe(4);

    const standardTier = quoteRes.body.quotes.find((q: any) => q.tier === 'STANDARD_60');
    expect(standardTier).toBeDefined();
    // 3 stores means 2 extra pickup stops
    expect(standardTier.pricing.extraPickupStopPaise).toBeGreaterThan(0);
    expect(standardTier.pricing.totalDeliveryFeePaise).toBeGreaterThan(0);
  });
});
