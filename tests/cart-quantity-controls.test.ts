import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../server/src/index';
import { prisma } from '../server/src/db';

describe('Everything Local — Product Add-To-Cart Quantity Controls & Shared Cart State', () => {
  let customerToken: string;
  let testStoreId: string;
  let productAId: string;
  let productBId: string;
  let productCId: string;
  let outOfStockProductId: string;

  let productAPricePaise: number;
  let productBPricePaise: number;
  let productCPricePaise: number;

  beforeAll(async () => {
    // 1. Authenticate Customer
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ emailOrPhone: 'ayush@example.com', password: 'Password@123' });
    customerToken = loginRes.body.token;
    expect(customerToken).toBeDefined();

    // 2. Fetch Palasia Store & Products
    const storesRes = await request(app).get('/api/customer/stores?lat=22.7244&lng=75.8839');
    expect(storesRes.status).toBe(200);
    const store = storesRes.body.stores[0];
    testStoreId = store.id;

    // Get Storefront Products
    const storefrontRes = await request(app).get(`/api/customer/stores/${testStoreId}`);
    expect(storefrontRes.status).toBe(200);
    const products = storefrontRes.body.store.products;
    expect(products.length).toBeGreaterThanOrEqual(3);

    productAId = products[0].id;
    productAPricePaise = products[0].pricePaise;

    productBId = products[1].id;
    productBPricePaise = products[1].pricePaise;

    productCId = products[2].id;
    productCPricePaise = products[2].pricePaise;

    // Create an explicit out-of-stock / unavailable product for testing
    const outOfStockProd = await prisma.product.create({
      data: {
        storeId: testStoreId,
        name: 'Special Limited Season Alphonso Mango (Out of Stock)',
        category: 'Produce',
        mrpPaise: 120000,
        pricePaise: 99900,
        stock: 0,
        isAvailable: false
      }
    });
    outOfStockProductId = outOfStockProd.id;

    // Clear cart before test suite starts
    await request(app)
      .delete('/api/customer/cart')
      .set('Authorization', `Bearer ${customerToken}`);
  });

  // Test 1: Click ADD: quantity becomes 1
  it('Step 1: Clicking ADD adds 1 unit to cart and initiates quantity stepper', async () => {
    const res = await request(app)
      .post('/api/customer/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        storeId: testStoreId,
        productId: productAId,
        quantity: 1
      });

    expect(res.status).toBe(200);
    expect(res.body.cart).toBeDefined();
    expect(res.body.cart.items.length).toBe(1);

    const itemA = res.body.cart.items.find((i: any) => i.productId === productAId);
    expect(itemA).toBeDefined();
    expect(itemA.quantity).toBe(1);
    expect(itemA.unitPricePaise).toBe(productAPricePaise);
  });

  // Test 2: Click plus: quantity becomes 2
  it('Step 2: Clicking [+] increases quantity from 1 to exactly 2', async () => {
    const res = await request(app)
      .post('/api/customer/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        storeId: testStoreId,
        productId: productAId,
        quantity: 2
      });

    expect(res.status).toBe(200);
    const itemA = res.body.cart.items.find((i: any) => i.productId === productAId);
    expect(itemA).toBeDefined();
    expect(itemA.quantity).toBe(2);
  });

  // Test 3: Click minus: quantity becomes 1
  it('Step 3: Clicking [-] decreases quantity from 2 to exactly 1', async () => {
    const res = await request(app)
      .post('/api/customer/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        storeId: testStoreId,
        productId: productAId,
        quantity: 1
      });

    expect(res.status).toBe(200);
    const itemA = res.body.cart.items.find((i: any) => i.productId === productAId);
    expect(itemA).toBeDefined();
    expect(itemA.quantity).toBe(1);
  });

  // Test 4: Click minus again: quantity becomes zero and item is removed, restoring ADD
  it('Step 4: Clicking [-] at quantity 1 decreases to 0 and removes item from cart', async () => {
    const res = await request(app)
      .post('/api/customer/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        storeId: testStoreId,
        productId: productAId,
        quantity: 0
      });

    expect(res.status).toBe(200);
    const itemA = res.body.cart.items.find((i: any) => i.productId === productAId);
    expect(itemA).toBeUndefined();
    expect(res.body.cart.items.length).toBe(0);
  });

  // Test 5: Add three different products independently
  it('Step 5: Customer adds three different products with independent quantities', async () => {
    // Add Product A with quantity 2
    await request(app)
      .post('/api/customer/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ storeId: testStoreId, productId: productAId, quantity: 2 });

    // Add Product B with quantity 3
    await request(app)
      .post('/api/customer/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ storeId: testStoreId, productId: productBId, quantity: 3 });

    // Add Product C with quantity 1
    const res = await request(app)
      .post('/api/customer/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ storeId: testStoreId, productId: productCId, quantity: 1 });

    expect(res.status).toBe(200);
    expect(res.body.cart.items.length).toBe(3);

    const itemA = res.body.cart.items.find((i: any) => i.productId === productAId);
    const itemB = res.body.cart.items.find((i: any) => i.productId === productBId);
    const itemC = res.body.cart.items.find((i: any) => i.productId === productCId);

    expect(itemA.quantity).toBe(2);
    expect(itemB.quantity).toBe(3);
    expect(itemC.quantity).toBe(1);
  });

  // Test 6: Verify cart badge count and subtotal calculation
  it('Step 6: Verifies global cart item count (2+3+1 = 6) and accurate subtotal in paise', async () => {
    const cartRes = await request(app)
      .get('/api/customer/cart')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(cartRes.status).toBe(200);
    const items = cartRes.body.cart.items;
    const totalCount = items.reduce((sum: number, i: any) => sum + i.quantity, 0);
    expect(totalCount).toBe(6);

    const expectedSubtotalPaise =
      (2 * productAPricePaise) +
      (3 * productBPricePaise) +
      (1 * productCPricePaise);

    expect(cartRes.body.subtotalPaise).toBe(expectedSubtotalPaise);
  });

  // Test 7: Verify cart persistence on page reload
  it('Step 7: Cart contents and quantities persist identically across requests', async () => {
    const reloadRes = await request(app)
      .get('/api/customer/cart')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(reloadRes.status).toBe(200);
    expect(reloadRes.body.cart.items.length).toBe(3);

    const map: Record<string, number> = {};
    for (const item of reloadRes.body.cart.items) {
      map[item.productId] = item.quantity;
    }

    expect(map[productAId]).toBe(2);
    expect(map[productBId]).toBe(3);
    expect(map[productCId]).toBe(1);
  });

  // Test 8: Change quantity from another screen (e.g. cart drawer / category view)
  it('Step 8: Changing quantity of Product B to 5 updates shared state globally', async () => {
    const updateRes = await request(app)
      .post('/api/customer/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        storeId: testStoreId,
        productId: productBId,
        quantity: 5
      });

    expect(updateRes.status).toBe(200);
    const itemB = updateRes.body.cart.items.find((i: any) => i.productId === productBId);
    expect(itemB.quantity).toBe(5);

    // Verify subtotal re-computed immediately
    const cartRes = await request(app)
      .get('/api/customer/cart')
      .set('Authorization', `Bearer ${customerToken}`);

    const expectedSubtotalPaise =
      (2 * productAPricePaise) +
      (5 * productBPricePaise) +
      (1 * productCPricePaise);

    expect(cartRes.body.subtotalPaise).toBe(expectedSubtotalPaise);
  });

  // Test 9: Attempting to add an out-of-stock product is blocked
  it('Step 9: Attempting to add an unavailable or out-of-stock product is rejected with 400', async () => {
    const blockRes = await request(app)
      .post('/api/customer/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        storeId: testStoreId,
        productId: outOfStockProductId,
        quantity: 1
      });

    expect(blockRes.status).toBe(400);
    expect(blockRes.body.error).toMatch(/unavailable/i);
  });

  // Test 10: Removing one item keeps other items intact
  it('Step 10: Setting quantity of Product A to 0 removes only Product A and preserves B and C', async () => {
    const removeRes = await request(app)
      .post('/api/customer/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        storeId: testStoreId,
        productId: productAId,
        quantity: 0
      });

    expect(removeRes.status).toBe(200);
    expect(removeRes.body.cart.items.length).toBe(2);

    const remainingProductIds = removeRes.body.cart.items.map((i: any) => i.productId);
    expect(remainingProductIds).not.toContain(productAId);
    expect(remainingProductIds).toContain(productBId);
    expect(remainingProductIds).toContain(productCId);
  });
});
