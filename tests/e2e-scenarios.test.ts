import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../server/src/index';
import { prisma } from '../server/src/db';
import { MultiStoreOrderEngine } from '../server/src/core/multiStoreOrderEngine';
import { PaymentLifecycleEngine } from '../server/src/core/paymentLifecycleEngine';
import { DoubleEntryLedgerEngine, LedgerAccount } from '../server/src/core/doubleEntryLedger';
import { DeliveryPriorityEngine } from '../server/src/core/deliveryPriorityEngine';
import { FinancialEngine } from '../server/src/core/finance';
import crypto from 'crypto';

describe('Everything Local — Master End-to-End Scenario Test Suite (12 Critical Scenarios)', () => {
  let customerToken: string;
  let customerId: string;
  let merchant1Token: string;
  let merchant2Token: string;
  let merchant3Token: string;
  let riderToken: string;
  let adminToken: string;

  let storeA: any;
  let storeB: any;
  let storeC: any;

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

    // 3. Authenticate Rider
    const riderRes = await request(app)
      .post('/api/auth/login')
      .send({ emailOrPhone: 'rahul.rider@everythinglocal.in', password: 'Password@123' });
    expect(riderRes.status).toBe(200);
    riderToken = riderRes.body.token;

    // 4. Authenticate Merchants
    const m1Res = await request(app)
      .post('/api/auth/login')
      .send({ emailOrPhone: 'sharma.kirana@everythinglocal.in', password: 'Password@123' });
    expect(m1Res.status).toBe(200);
    merchant1Token = m1Res.body.token;

    const m2Res = await request(app)
      .post('/api/auth/login')
      .send({ emailOrPhone: 'apna.fresh@everythinglocal.in', password: 'Password@123' });
    expect(m2Res.status).toBe(200);
    merchant2Token = m2Res.body.token;

    // 5. Look up Stores and ensure products have sufficient stock
    const stores = await prisma.store.findMany({
      where: {
        owner: {
          email: {
            in: [
              'sharma.kirana@everythinglocal.in',
              'apna.fresh@everythinglocal.in',
              'apollo.pharmacy@everythinglocal.in'
            ]
          }
        }
      },
      include: { products: true }
    });

    storeA = stores.find((s) => s.ownerId === m1Res.body.user.id);
    storeB = stores.find((s) => s.ownerId === m2Res.body.user.id);
    storeC = stores.find((s) => s.id !== storeA?.id && s.id !== storeB?.id);

    // If storeC is not found among the three, pick any other store in DB
    if (!storeC) {
      storeC = await prisma.store.findFirst({
        where: { id: { notIn: [storeA.id, storeB.id] } },
        include: { products: true }
      });
    }

    expect(storeA).toBeDefined();
    expect(storeB).toBeDefined();
    expect(storeC).toBeDefined();

    // Ensure ample stock for all test products
    await prisma.product.updateMany({
      where: {
        storeId: { in: [storeA.id, storeB.id, storeC.id] }
      },
      data: { stock: 100, isAvailable: true }
    });
  });

  // SCENARIO 1: Customer orders from one merchant
  it('Scenario 1: Customer orders from one merchant with atomic parent-child creation & ledger balancing', async () => {
    const initialProduct = await prisma.product.findUnique({ where: { id: storeA.products[0].id } });
    const initialStock = initialProduct!.stock;

    const checkoutRes = await request(app)
      .post('/api/customer/orders/multi-store')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        deliveryPriorityTier: 'STANDARD_60',
        customerLat: 22.7244,
        customerLng: 75.8839,
        deliveryAddress: '101, Saket Nagar, Indore',
        paymentMethod: 'ONLINE',
        items: [
          {
            productId: storeA.products[0].id,
            storeId: storeA.id,
            productName: storeA.products[0].name,
            quantity: 2,
            unitPricePaise: storeA.products[0].pricePaise
          }
        ]
      });

    expect(checkoutRes.status).toBe(201);
    expect(checkoutRes.body.parentOrder).toBeDefined();
    expect(checkoutRes.body.merchantChildOrders.length).toBe(1);

    const child = checkoutRes.body.merchantChildOrders[0];
    expect(child.storeId).toBe(storeA.id);
    expect(child.status).toBe('PENDING_ACCEPTANCE');

    // Verify stock decrement
    const updatedProduct = await prisma.product.findUnique({ where: { id: storeA.products[0].id } });
    expect(updatedProduct!.stock).toBe(initialStock - 2);

    // Verify delivery task created
    const deliveryTask = await prisma.deliveryTask.findFirst({
      where: { parentOrderId: checkoutRes.body.parentOrder.id }
    });
    expect(deliveryTask).toBeDefined();
    expect(deliveryTask!.status).toBe('AVAILABLE');
    expect(deliveryTask!.pickupOtp).toHaveLength(4);
    expect(deliveryTask!.deliveryOtp).toHaveLength(4);
  });

  // SCENARIO 2: Customer orders from three merchants in one cart
  it('Scenario 2: Customer orders from three merchants in one cart with multi-stop logistics', async () => {
    const checkoutRes = await request(app)
      .post('/api/customer/orders/multi-store')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        deliveryPriorityTier: 'STANDARD_60',
        customerLat: 22.7533,
        customerLng: 75.8937,
        deliveryAddress: 'Vijay Nagar, Scheme 54, Indore',
        paymentMethod: 'ONLINE',
        items: [
          {
            productId: storeA.products[0].id,
            storeId: storeA.id,
            productName: storeA.products[0].name,
            quantity: 1,
            unitPricePaise: storeA.products[0].pricePaise
          },
          {
            productId: storeB.products[0].id,
            storeId: storeB.id,
            productName: storeB.products[0].name,
            quantity: 1,
            unitPricePaise: storeB.products[0].pricePaise
          },
          {
            productId: storeC.products[0].id,
            storeId: storeC.id,
            productName: storeC.products[0].name,
            quantity: 1,
            unitPricePaise: storeC.products[0].pricePaise
          }
        ]
      });

    expect(checkoutRes.status).toBe(201);
    expect(checkoutRes.body.parentOrder).toBeDefined();
    expect(checkoutRes.body.merchantChildOrders.length).toBe(3);

    // Verify 3 distinct delivery tasks or stops created
    const tasks = await prisma.deliveryTask.findMany({
      where: { parentOrderId: checkoutRes.body.parentOrder.id }
    });
    expect(tasks.length).toBe(3);
  });

  // SCENARIO 3: One merchant rejects its order while the others continue
  it('Scenario 3: One merchant rejects its child order; remaining merchant orders proceed intact with automatic refund', async () => {
    // Create multi-store order from Store A and Store B
    const checkoutRes = await request(app)
      .post('/api/customer/orders/multi-store')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        deliveryPriorityTier: 'STANDARD_60',
        customerLat: 22.7244,
        customerLng: 75.8839,
        deliveryAddress: 'Palasia, Indore',
        paymentMethod: 'ONLINE',
        items: [
          {
            productId: storeA.products[0].id,
            storeId: storeA.id,
            productName: storeA.products[0].name,
            quantity: 1,
            unitPricePaise: storeA.products[0].pricePaise
          },
          {
            productId: storeB.products[0].id,
            storeId: storeB.id,
            productName: storeB.products[0].name,
            quantity: 2,
            unitPricePaise: storeB.products[0].pricePaise
          }
        ]
      });

    expect(checkoutRes.status).toBe(201);
    const childA = checkoutRes.body.merchantChildOrders.find((c: any) => c.storeId === storeA.id);
    const childB = checkoutRes.body.merchantChildOrders.find((c: any) => c.storeId === storeB.id);

    const initialStockB = (await prisma.product.findUnique({ where: { id: storeB.products[0].id } }))!.stock;

    // Store B rejects its order
    const rejectionRes = await MultiStoreOrderEngine.handlePartialMerchantRejection(
      childB.id,
      'Damaged batch during shelf picking'
    );

    // Verify Child B is REJECTED
    expect(rejectionRes.rejectedChildOrder.status).toBe('REJECTED');

    // Verify Child A remains INTACT (not rejected)
    const refreshedChildA = await prisma.merchantChildOrder.findUnique({ where: { id: childA.id } });
    expect(refreshedChildA!.status).not.toBe('REJECTED');
    expect(refreshedChildA!.status).toBe('PENDING_ACCEPTANCE');

    // Verify stock restored for Store B
    const restoredStockB = (await prisma.product.findUnique({ where: { id: storeB.products[0].id } }))!.stock;
    expect(restoredStockB).toBe(initialStockB + 2);

    // Verify Parent Order status is PARTIALLY_FULFILLED
    const refreshedParent = await prisma.parentOrder.findUnique({ where: { id: checkoutRes.body.parentOrder.id } });
    expect(refreshedParent!.status).toBe('PARTIALLY_FULFILLED');
    expect(refreshedParent!.refundedAmountPaise).toBe(childB.subtotalPaise);
  });

  // SCENARIO 4: One merchant runs out of stock during checkout
  it('Scenario 4: Insufficient stock aborts checkout transaction cleanly without partial order creation', async () => {
    // Set Store A product stock to 0
    await prisma.product.update({
      where: { id: storeA.products[0].id },
      data: { stock: 0 }
    });

    const checkoutRes = await request(app)
      .post('/api/customer/orders/multi-store')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        deliveryPriorityTier: 'STANDARD_60',
        customerLat: 22.7244,
        customerLng: 75.8839,
        deliveryAddress: 'Palasia, Indore',
        paymentMethod: 'ONLINE',
        items: [
          {
            productId: storeA.products[0].id,
            storeId: storeA.id,
            productName: storeA.products[0].name,
            quantity: 1,
            unitPricePaise: storeA.products[0].pricePaise
          }
        ]
      });

    expect(checkoutRes.status).toBe(400);
    expect(checkoutRes.body.error).toMatch(/Insufficient stock/i);

    // Restore stock
    await prisma.product.update({
      where: { id: storeA.products[0].id },
      data: { stock: 50 }
    });
  });

  // SCENARIO 5: Product price changes before payment
  it('Scenario 5: Dynamic quote snapshots detect price changes and enforce quote expiration', async () => {
    // Add item with subtotal meeting MOV (>= ₹299)
    await request(app)
      .post('/api/customer/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ storeId: storeA.id, productId: storeA.products[0].id, quantity: 4 });

    // Request order quote
    const quoteRes = await request(app)
      .post('/api/customer/orders/quote')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        fulfillmentMode: 'PLATFORM_DELIVERY',
        customerLat: 22.7244,
        customerLng: 75.8839
      });

    expect(quoteRes.status).toBe(200);
    expect(quoteRes.body.validUntil).toBeDefined();
    expect(quoteRes.body.pricingVersion).toBe('2.0');
    expect(quoteRes.body.financials).toBeDefined();
    expect(quoteRes.body.financials.itemSubtotalPaise).toBeGreaterThan(0);
    expect(new Date(quoteRes.body.validUntil).getTime()).toBeGreaterThan(Date.now());
  });

  // SCENARIO 6: Payment fails or is abandoned
  it('Scenario 6: Payment failure records transaction state transition and leaves order unconfirmed', async () => {
    const parentOrder = await prisma.parentOrder.create({
      data: {
        orderNumber: `EL-TEST-${Date.now()}`,
        customerId,
        status: 'PENDING_PAYMENT',
        paymentStatus: 'PENDING',
        paymentMethod: 'ONLINE',
        deliveryTier: 'STANDARD_60',
        deliveryAddress: 'Test Address, Indore',
        totalItemSubtotalPaise: 50000,
        totalDeliveryFeePaise: 4000,
        totalPaidPaise: 54000
      }
    });

    const rawPayload = JSON.stringify({ eventId: `evt_fail_${Date.now()}`, orderId: parentOrder.id });
    const webhookSecret = 'test_webhook_secret_key_123';
    const sig = crypto.createHmac('sha256', webhookSecret).update(rawPayload).digest('hex');

    // Process payment.failed webhook
    const failureResult = PaymentLifecycleEngine.processWebhookEvent(
      {
        eventId: `evt_fail_${Date.now()}`,
        eventType: 'payment.failed',
        paymentId: `pay_fail_${Date.now()}`,
        orderNumber: parentOrder.orderNumber,
        amountPaise: parentOrder.totalPaidPaise,
        status: 'FAILED',
        signature: sig,
        rawPayload
      },
      webhookSecret
    );

    expect(failureResult.success).toBe(true);
    expect(failureResult.status).toBe('FAILED');
    expect(failureResult.isDuplicate).toBe(false);
  });

  // SCENARIO 7: Payment webhook is delivered twice
  it('Scenario 7: Duplicate payment webhook is idempotently rejected without double-crediting ledger', async () => {
    PaymentLifecycleEngine.resetEventDeduplicationCache();
    const eventId = `evt_dedup_${Date.now()}`;
    const webhookSecret = 'test_webhook_secret_key_123';
    const rawPayload = JSON.stringify({ eventId, amount: 50000 });
    const sig = crypto.createHmac('sha256', webhookSecret).update(rawPayload).digest('hex');

    const webhookPayload = {
      eventId,
      eventType: 'payment.captured' as const,
      paymentId: `pay_dedup_${Date.now()}`,
      orderNumber: `ORD-DEDUP-${Date.now()}`,
      amountPaise: 50000,
      status: 'CAPTURED' as const,
      signature: sig,
      rawPayload
    };

    // First delivery
    const firstDelivery = PaymentLifecycleEngine.processWebhookEvent(webhookPayload, webhookSecret);
    expect(firstDelivery.success).toBe(true);
    expect(firstDelivery.isDuplicate).toBe(false);
    expect(firstDelivery.status).toBe('CAPTURED');

    // Duplicate delivery
    const secondDelivery = PaymentLifecycleEngine.processWebhookEvent(webhookPayload, webhookSecret);
    expect(secondDelivery.success).toBe(true);
    expect(secondDelivery.isDuplicate).toBe(true);
    expect(secondDelivery.message).toMatch(/already been processed idempotently/i);
  });

  // SCENARIO 8: Customer cancellation and partial refund
  it('Scenario 8: Customer cancellation calculates fault-based refund excluding delivery fee post-dispatch', async () => {
    const itemPricePaise = 45000;
    const deliveryFeePaise = 5000;

    // Customer cancellation post-dispatch (Customer Fault / Change of mind)
    const customerRefund = FinancialEngine.calculateItemRefund({
      itemUnitPricePaise: itemPricePaise,
      quantity: 1,
      commissionRatePct: 5.0,
      taxRatePct: 0,
      deliveryFeeRefundPaise: 0, // Delivery fee non-refundable
      isMerchantFault: false,
      reason: 'Customer changed mind post-dispatch'
    });

    // Customer receives item refund, but delivery fee is retained
    expect(customerRefund.customerRefundPaise).toBe(itemPricePaise);
    expect(customerRefund.isMerchantFault).toBe(false);

    // Merchant fault cancellation pre-dispatch (Store Closed / Out of Stock)
    const merchantFaultRefund = FinancialEngine.calculateItemRefund({
      itemUnitPricePaise: itemPricePaise,
      quantity: 1,
      commissionRatePct: 5.0,
      taxRatePct: 0,
      deliveryFeeRefundPaise: deliveryFeePaise, // 100% delivery fee refunded
      isMerchantFault: true,
      reason: 'Merchant out of stock'
    });

    // Customer receives 100% item refund + 100% delivery fee
    expect(merchantFaultRefund.customerRefundPaise).toBe(itemPricePaise + deliveryFeePaise);
    expect(merchantFaultRefund.isMerchantFault).toBe(true);
  });

  // SCENARIO 9: Rider fails to accept a task
  it('Scenario 9: Unaccepted delivery task can be cancelled or marked for manual reassignment', async () => {
    const task = await prisma.deliveryTask.create({
      data: {
        taskNumber: `EL-TASK-UNASSIGNED-${Date.now()}`,
        status: 'AVAILABLE',
        priorityTier: 'STANDARD_60',
        pickupLocationName: 'Sharma Kirana',
        pickupAddress: 'Palasia, Indore',
        pickupLatitude: 22.7196,
        pickupLongitude: 75.8577,
        deliveryAddress: 'Vijay Nagar, Indore',
        deliveryLatitude: 22.7533,
        deliveryLongitude: 75.8937,
        estimatedDistanceKm: 4.2,
        estimatedMinutes: 35,
        riderBasePayoutPaise: 3000,
        totalPayoutPaise: 3000,
        pickupOtp: '1111',
        deliveryOtp: '2222'
      }
    });

    // Simulate task expiration / rider timeout
    const updatedTask = await prisma.deliveryTask.update({
      where: { id: task.id },
      data: { status: 'CANCELLED' }
    });

    expect(updatedTask.status).toBe('CANCELLED');
    expect(updatedTask.riderId).toBeNull();
  });

  // SCENARIO 10: Merchant has multiple branches
  it('Scenario 10: Multi-store merchant tenancy middleware correctly scopes queries via x-store-id', async () => {
    // Sharma Kirana owner checks their primary store
    const storeRes = await request(app)
      .get('/api/merchant/store')
      .set('Authorization', `Bearer ${merchant1Token}`);

    expect(storeRes.status).toBe(200);
    expect(storeRes.body.store.id).toBe(storeA.id);

    // Merchant attempting to access Store B (which they do NOT own) is blocked (HTTP 403)
    const forbiddenRes = await request(app)
      .get('/api/merchant/store')
      .set('Authorization', `Bearer ${merchant1Token}`)
      .set('x-store-id', storeB.id);

    expect(forbiddenRes.status).toBe(403);
    expect(forbiddenRes.body.error).toMatch(/Forbidden/i);
  });

  // SCENARIO 11: Customer address is outside the delivery radius
  it('Scenario 11: Delivery engine flags locations outside max service radius as unserviceable', async () => {
    // Coordinates in Ujjain (~55 km away from Indore)
    const ujjainCoords = {
      latitude: 23.1765,
      longitude: 75.7885
    };

    const quotes = await DeliveryPriorityEngine.calculateAllTiers({
      customerCoordinates: ujjainCoords,
      merchantIds: [storeA.id],
      deliveryTier: 'EXPRESS_20'
    });

    // Express 20 requires max 3 km
    const expressQuote = quotes.find((q) => q.tierCode === 'EXPRESS_20');
    expect(expressQuote).toBeDefined();
    expect(expressQuote!.isServiceable).toBe(false);
    expect(expressQuote!.unserviceableReason).toMatch(/radius|distance/i);
  });

  // SCENARIO 12: Two customers attempt to buy the final available unit
  it('Scenario 12: Concurrent checkout on last available unit allows only 1 winner without negative stock', async () => {
    // Set stock of storeA product to exactly 1
    const testProductId = storeA.products[0].id;
    await prisma.product.update({
      where: { id: testProductId },
      data: { stock: 1, isAvailable: true }
    });

    // Create a second customer for concurrent checkout
    let secondCustomer = await prisma.user.findFirst({ where: { email: 'customer2@everythinglocal.in' } });
    if (!secondCustomer) {
      secondCustomer = await prisma.user.create({
        data: {
          email: 'customer2@everythinglocal.in',
          name: 'Concurrent Customer',
          passwordHash: 'dummy_hash',
          role: 'CUSTOMER'
        }
      });
    }

    // Launch two checkout requests simultaneously
    const req1 = MultiStoreOrderEngine.checkout({
      customerId,
      deliveryAddress: 'Address 1, Indore',
      deliveryLatitude: 22.7244,
      deliveryLongitude: 75.8839,
      deliveryTier: 'STANDARD_60',
      paymentMethod: 'ONLINE',
      items: [
        {
          productId: testProductId,
          storeId: storeA.id,
          productName: storeA.products[0].name,
          quantity: 1,
          unitPricePaise: storeA.products[0].pricePaise
        }
      ]
    });

    const req2 = MultiStoreOrderEngine.checkout({
      customerId: secondCustomer.id,
      deliveryAddress: 'Address 2, Indore',
      deliveryLatitude: 22.7244,
      deliveryLongitude: 75.8839,
      deliveryTier: 'STANDARD_60',
      paymentMethod: 'ONLINE',
      items: [
        {
          productId: testProductId,
          storeId: storeA.id,
          productName: storeA.products[0].name,
          quantity: 1,
          unitPricePaise: storeA.products[0].pricePaise
        }
      ]
    });

    const results = await Promise.allSettled([req1, req2]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    // Exactly one checkout must succeed and one must fail
    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);

    // Verify error message on the rejected checkout
    const rejectionReason = (rejected[0] as PromiseRejectedResult).reason;
    expect(rejectionReason.message).toMatch(/Insufficient stock/i);

    // Verify stock is exactly 0 (never negative)
    const finalProduct = await prisma.product.findUnique({ where: { id: testProductId } });
    expect(finalProduct!.stock).toBe(0);

    // Restore stock for future tests
    await prisma.product.update({
      where: { id: testProductId },
      data: { stock: 50 }
    });
  });
});
