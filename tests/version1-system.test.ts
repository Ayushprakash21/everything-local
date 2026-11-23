import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../server/src/index';
import { prisma } from '../server/src/db';
import { DeliveryPriorityEngine } from '../server/src/core/deliveryPriorityEngine';
import { MultiStoreOrderEngine } from '../server/src/core/multiStoreOrderEngine';
import { MerchantSettlementEngine } from '../server/src/core/merchantSettlementEngine';

describe('Everything Local — Master System Test Suite (Version 1.0)', () => {
  let customerToken: string;
  let merchant1Token: string;
  let merchant2Token: string;
  let riderToken: string;
  let adminToken: string;

  let customerUserId: string;
  let store1Id: string;
  let store2Id: string;
  let product1Id: string;
  let product2Id: string;
  let testRiderId: string;

  let createdParentOrderId: string;
  let childOrder1Id: string;
  let childOrder2Id: string;
  let generatedTaskId: string;
  let merchantPickupOtp: string;
  let customerDeliveryOtp: string;

  beforeAll(async () => {
    // 1. Authenticate Customer
    const custRes = await request(app)
      .post('/api/auth/login')
      .send({ emailOrPhone: 'ayush@example.com', password: 'Password@123' });
    customerToken = custRes.body.token;
    customerUserId = custRes.body.user.id;

    // 2. Authenticate Merchants
    const m1Res = await request(app)
      .post('/api/auth/login')
      .send({ emailOrPhone: 'sharma.kirana@everythinglocal.in', password: 'Password@123' });
    merchant1Token = m1Res.body.token;

    const m2Res = await request(app)
      .post('/api/auth/login')
      .send({ emailOrPhone: 'apna.fresh@everythinglocal.in', password: 'Password@123' });
    merchant2Token = m2Res.body.token;

    // 3. Authenticate Rider
    const rRes = await request(app)
      .post('/api/auth/login')
      .send({ emailOrPhone: 'rahul.rider@everythinglocal.in', password: 'Password@123' });
    riderToken = rRes.body.token;

    // 4. Authenticate Admin
    const admRes = await request(app)
      .post('/api/auth/login')
      .send({ emailOrPhone: 'admin@everythinglocal.in', password: 'Password@123' });
    adminToken = admRes.body.token;

    // 5. Look up Stores and Products by Owner
    const store1 = await prisma.store.findFirst({
      where: { owner: { email: 'sharma.kirana@everythinglocal.in' } },
      include: { products: true }
    });
    const store2 = await prisma.store.findFirst({
      where: { owner: { email: 'apna.fresh@everythinglocal.in' } },
      include: { products: true }
    });
    expect(store1).toBeDefined();
    expect(store2).toBeDefined();
    store1Id = store1!.id;
    store2Id = store2!.id;
    product1Id = store1!.products[0].id;
    product2Id = store2!.products[0].id;

    // Ensure ample stock for test products
    await prisma.product.updateMany({
      where: { id: { in: [product1Id, product2Id] } },
      data: { stock: 100, isAvailable: true }
    });

    let riderProfile = await prisma.riderProfile.findFirst();
    if (!riderProfile) {
      const riderUser = await prisma.user.findFirst({ where: { role: 'RIDER' } });
      if (riderUser) {
        riderProfile = await prisma.riderProfile.create({
          data: {
            userId: riderUser.id,
            riderCode: 'RDR-IND-0101',
            fullName: 'Rahul Sharma (Fleet Partner)',
            phone: '+91 98260 11111',
            vehicleType: 'BIKE',
            vehiclePlate: 'MP-09-AB-1234',
            drivingLicenseNo: 'MP0920240012345',
            upiId: 'rahul.rider@okaxis',
            isOnline: true,
            isActive: true,
            rating: 4.92,
            totalDeliveries: 342
          }
        });
      }
    }
    expect(riderProfile).toBeDefined();
    testRiderId = riderProfile!.id;
  });

  // =========================================================================
  // SCENARIO 1: 4-Tier Delivery Priority Pricing & Dynamic Quotation Engine
  // =========================================================================
  describe('1. 4-Tier Delivery Priority & Dynamic Pricing Engine', () => {
    it('calculates quotes for all 4 delivery tiers with distance, weight and extra pickup fees', async () => {
      const res = await request(app)
        .post('/api/customer/delivery/quote')
        .send({
          storeIds: [store1Id, store2Id],
          customerLat: 22.7244,
          customerLng: 75.8839, // Palasia
          totalWeightKg: 3.5
        });

      expect(res.status).toBe(200);
      expect(res.body.quotes).toBeDefined();
      expect(res.body.quotes.length).toBe(4);

      const tiers = res.body.quotes.map((q: any) => q.tierCode);
      expect(tiers).toContain('EXPRESS_20');
      expect(tiers).toContain('PRIORITY_40');
      expect(tiers).toContain('STANDARD_60');
      expect(tiers).toContain('SCHEDULED_120');

      // Check multi-store stop fee applied because 2 distinct stores are in cart
      const priorityQuote = res.body.quotes.find((q: any) => q.tierCode === 'PRIORITY_40');
      expect(priorityQuote.pricing.additionalPickupChargePaise).toBeGreaterThan(0);
      expect(priorityQuote.pricing.totalDeliveryFeePaise).toBeGreaterThan(priorityQuote.pricing.baseDeliveryPaise);
    });

    it('enforces Express 20 feasibility limits (max 2 stores, max distance, max weight)', async () => {
      // Direct core engine evaluation with 4 stores (exceeds Express 20 max 2 store pickup limit)
      const quotes = await DeliveryPriorityEngine.calculateAllTiers({
        merchantIds: [store1Id, store2Id, 'store-dummy-3', 'store-dummy-4'],
        customerCoordinates: { latitude: 22.7244, longitude: 75.8839 },
        totalWeightKg: 10.5
      });

      const expressQuote = quotes.find((q) => q.tierCode === 'EXPRESS_20');
      expect(expressQuote).toBeDefined();
      expect(expressQuote!.isServiceable).toBe(false);
      expect(expressQuote!.unserviceableReason).toMatch(/store|weight/i);
    });
  });

  // =========================================================================
  // SCENARIO 2: Multi-Store Consolidated Order & Atomic Parent-Child Checkout
  // =========================================================================
  describe('2. Multi-Store Consolidated Order & Atomic Parent-Child Checkout', () => {
    it('creates a unified ParentOrder and independent MerchantChildOrders in a single transaction', async () => {
      // Execute multi-store checkout
      const checkoutRes = await request(app)
        .post('/api/customer/orders/multi-store')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          deliveryPriorityTier: 'PRIORITY_40',
          customerLat: 22.7244,
          customerLng: 75.8839,
          deliveryAddress: 'Flat 402, Shalimar Palms, Pipliyahana, Indore',
          paymentMethod: 'ONLINE',
          items: [
            {
              productId: product1Id,
              storeId: store1Id,
              productName: 'Aashirvaad Shudh Chakki Atta 5kg',
              quantity: 2,
              unitPricePaise: 23500
            },
            {
              productId: product2Id,
              storeId: store2Id,
              productName: 'Fresh Organic Produce',
              quantity: 1,
              unitPricePaise: 18000
            }
          ]
        });

      if (checkoutRes.status !== 201) {
        console.error('CHECKOUT FAILED:', checkoutRes.body);
      }
      expect(checkoutRes.status).toBe(201);
      expect(checkoutRes.body.parentOrder).toBeDefined();
      expect(checkoutRes.body.childOrders).toBeDefined();
      expect(checkoutRes.body.childOrders.length).toBe(2);

      createdParentOrderId = checkoutRes.body.parentOrder.id;
      childOrder1Id = checkoutRes.body.childOrders[0].id;
      childOrder2Id = checkoutRes.body.childOrders[1].id;

      // Verify DeliveryTasks were created with pickup & delivery OTPs
      const task = await prisma.deliveryTask.findFirst({
        where: { parentOrderId: createdParentOrderId }
      });
      expect(task).toBeDefined();
      generatedTaskId = task!.id;
      merchantPickupOtp = task!.pickupOtp;
      customerDeliveryOtp = task!.deliveryOtp;
      expect(merchantPickupOtp).toHaveLength(4);
      expect(customerDeliveryOtp).toHaveLength(4);
    });

    it('fetches customer multi-store orders with child breakdowns and delivery OTP', async () => {
      const res = await request(app)
        .get('/api/customer/orders/multi-store')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.parentOrders.length).toBeGreaterThan(0);
      const found = res.body.parentOrders.find((p: any) => p.id === createdParentOrderId);
      expect(found).toBeDefined();
      expect(found.childOrders.length).toBe(2);
      expect(found.deliveryTasks.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // SCENARIO 3: Independent Merchant Acceptance & Partial Rejection with Refund
  // =========================================================================
  describe('3. Independent Merchant Workflow & Partial Rejection Handling', () => {
    it('allows merchant 1 to accept and prepare their child order', async () => {
      const acceptRes = await request(app)
        .post(`/api/merchant/orders/child/${childOrder1Id}/accept`)
        .set('Authorization', `Bearer ${merchant1Token}`);

      expect(acceptRes.status).toBe(200);
      expect(['ACCEPTED', 'MERCHANT_ACCEPTED']).toContain(acceptRes.body.childOrder.status);

      const readyRes = await request(app)
        .post(`/api/merchant/orders/child/${childOrder1Id}/ready`)
        .set('Authorization', `Bearer ${merchant1Token}`);

      expect(readyRes.status).toBe(200);
      expect(readyRes.body.childOrder.status).toBe('READY_FOR_PICKUP');
    });

    it('handles merchant 2 partial rejection with refund calculation while preserving merchant 1', async () => {
      const rejectRes = await request(app)
        .post(`/api/merchant/orders/child/${childOrder2Id}/reject`)
        .set('Authorization', `Bearer ${merchant2Token}`)
        .send({ reason: 'Item temporarily out of stock at this branch' });

      expect(rejectRes.status).toBe(200);
      expect(rejectRes.body.result).toBeDefined();
      expect(rejectRes.body.result.refundAmountPaise).toBeGreaterThan(0);

      // Verify that Child Order 1 was NOT disrupted
      const child1 = await prisma.merchantChildOrder.findUnique({ where: { id: childOrder1Id } });
      expect(child1!.status).toBe('READY_FOR_PICKUP');

      // Verify refund financial ledger entry
      const ledgerEntry = await prisma.financialLedgerEntry.findFirst({
        where: {
          storeId: store2Id,
          entryType: 'REFUND_REVERSAL'
        }
      });
      expect(ledgerEntry).toBeDefined();
    });
  });

  // =========================================================================
  // SCENARIO 4: Standalone Delivery Partner (Rider) Lifecycle & OTP Handovers
  // =========================================================================
  describe('4. Standalone Delivery Partner (Rider) Lifecycle & OTP Handovers', () => {
    it('rider views available tasks and accepts the active delivery trip', async () => {
      const acceptRes = await request(app)
        .post(`/api/rider/tasks/${generatedTaskId}/accept`)
        .set('Authorization', `Bearer ${riderToken}`);

      expect(acceptRes.status).toBe(200);
      expect(acceptRes.body.task.status).toBe('ACCEPTED');
      expect(acceptRes.body.task.riderId).toBeDefined();
    });

    it('rider marks arrived at store', async () => {
      const arrRes = await request(app)
        .post(`/api/rider/tasks/${generatedTaskId}/at-store`)
        .set('Authorization', `Bearer ${riderToken}`);

      expect(arrRes.status).toBe(200);
      expect(arrRes.body.task.status).toBe('AT_STORE');
    });

    it('rejects incorrect pickup OTP and accepts valid merchant pickup OTP', async () => {
      // 1. Wrong OTP
      const failRes = await request(app)
        .post(`/api/rider/tasks/${generatedTaskId}/pickup`)
        .set('Authorization', `Bearer ${riderToken}`)
        .send({ otp: '0000' });
      expect(failRes.status).toBe(400);

      // 2. Correct OTP
      const passRes = await request(app)
        .post(`/api/rider/tasks/${generatedTaskId}/pickup`)
        .set('Authorization', `Bearer ${riderToken}`)
        .send({ otp: merchantPickupOtp });
      expect(passRes.status).toBe(200);
      expect(passRes.body.task.status).toBe('PICKED_UP');
    });

    it('completes delivery with customer delivery OTP and credits rider earnings ledger', async () => {
      // 1. Wrong OTP
      const failRes = await request(app)
        .post(`/api/rider/tasks/${generatedTaskId}/deliver`)
        .set('Authorization', `Bearer ${riderToken}`)
        .send({ otp: '9999' });
      expect(failRes.status).toBe(400);

      // 2. Correct OTP
      const passRes = await request(app)
        .post(`/api/rider/tasks/${generatedTaskId}/deliver`)
        .set('Authorization', `Bearer ${riderToken}`)
        .send({ otp: customerDeliveryOtp });
      expect(passRes.status).toBe(200);
      expect(passRes.body.task.status).toBe('DELIVERED');
      expect(passRes.body.payoutPaise).toBeGreaterThan(0);

      // Verify Rider Earning Ledger
      const earnRes = await request(app)
        .get('/api/rider/earnings')
        .set('Authorization', `Bearer ${riderToken}`);
      expect(earnRes.status).toBe(200);
      expect(earnRes.body.totalEarningsPaise).toBeGreaterThan(0);
      expect(earnRes.body.earnings.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // SCENARIO 5: Merchant Settlement Engine
  // =========================================================================
  describe('5. Merchant Settlement Engine & Financial Statement Generation', () => {
    it('calculates merchant settlement statement deducting commissions and refunds', async () => {
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const statement = await MerchantSettlementEngine.calculateSettlement(store1Id, startDate, endDate);
      expect(statement).toBeDefined();
      expect(statement.grossSalesPaise).toBeGreaterThanOrEqual(0);
      expect(statement.netMerchantPayablePaise).toBe(
        Math.max(
          0,
          statement.grossSalesPaise -
            statement.commissionDeductedPaise -
            statement.listingChargesPaise -
            statement.refundDeductionsPaise
        )
      );
    });
  });

  // =========================================================================
  // SCENARIO 6: AI Personal Shopping Assistant & Smart Basket Optimizer
  // =========================================================================
  describe('6. AI Personal Shopping Assistant & Smart Basket Optimizer', () => {
    it('generates 3 optimized basket strategies (Cheapest, Fastest, Balanced) across Indore stores', async () => {
      const res = await request(app)
        .post('/api/ai/optimize-basket')
        .send({
          items: ['Atta', 'Oil'],
          customerLat: 22.7244,
          customerLng: 75.8839
        });

      expect(res.status).toBe(200);
      expect(res.body.options).toBeDefined();
      expect(res.body.options.length).toBe(3);

      const types = res.body.options.map((o: any) => o.type);
      expect(types).toContain('CHEAPEST');
      expect(types).toContain('FASTEST_EXPRESS');
      expect(types).toContain('BALANCED');
    });

    it('answers recipe queries with suggested ingredient kits', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .send({ message: 'What ingredients do I need for Indori Poha?' });

      expect(res.status).toBe(200);
      expect(res.body.reply).toBeDefined();
      expect(res.body.suggestedItems).toBeDefined();
      expect(res.body.suggestedItems.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // SCENARIO 7: Household Operating System & Community Group Buying
  // =========================================================================
  describe('7. Household Operating System & Community Group Buying', () => {
    let householdId: string;
    let itemId: string;

    it('creates or fetches household and adds a recurring replenishment item', async () => {
      const myRes = await request(app)
        .get('/api/household/my')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(myRes.status).toBe(200);
      expect(myRes.body.household).toBeDefined();
      householdId = myRes.body.household.id;

      // Add recurring item
      const itemRes = await request(app)
        .post('/api/household/items')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          householdId,
          productName: 'Farm Fresh Gir Cow Milk 1L',
          quantity: 2,
          priority: 'HIGH',
          recurringIntervalDays: 1
        });

      expect(itemRes.status).toBe(201);
      expect(itemRes.body.item.productName).toBe('Farm Fresh Gir Cow Milk 1L');
      itemId = itemRes.body.item.id;
    });

    it('marks household item as purchased and removes it', async () => {
      const patchRes = await request(app)
        .patch(`/api/household/items/${itemId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ isPurchased: true });

      expect(patchRes.status).toBe(200);
      expect(patchRes.body.item.isPurchased).toBe(true);

      const delRes = await request(app)
        .delete(`/api/household/items/${itemId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(delRes.status).toBe(200);
    });

    it('allows users to pledge to community bulk campaigns', async () => {
      const campRes = await request(app).get('/api/community/campaigns');
      expect(campRes.status).toBe(200);
      expect(campRes.body.campaigns.length).toBeGreaterThan(0);

      const campId = campRes.body.campaigns[0].id;
      const initialPledges = campRes.body.campaigns[0].currentPledged;

      const pledgeRes = await request(app)
        .post(`/api/community/campaigns/${campId}/pledge`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ quantity: 1 });

      expect(pledgeRes.status).toBe(200);
      expect(pledgeRes.body.campaign.currentPledged).toBe(initialPledges + 1);
    });
  });

  // =========================================================================
  // SCENARIO 8: Admin Control Tower & Pricing Rules Administration
  // =========================================================================
  describe('8. Admin Control Tower & Rules Governance', () => {
    it('fetches executive control tower metrics (GMV, net margin, SLA, active fleet)', async () => {
      const res = await request(app)
        .get('/api/admin/control-tower/metrics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.metrics).toBeDefined();
      expect(res.body.metrics.netContributionPct).toBeDefined();
      expect(res.body.metrics.onTimeDeliveryPct).toBeDefined();
    });

    it('fetches and updates delivery priority pricing rules', async () => {
      const getRes = await request(app)
        .get('/api/admin/delivery-pricing')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.rules.length).toBe(4);

      // Update express 20 base fee
      const postRes = await request(app)
        .post('/api/admin/delivery-pricing')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tier: 'EXPRESS_20',
          baseDeliveryFeePaise: 4900,
          prioritySurchargePaise: 2500
        });

      expect(postRes.status).toBe(200);
      expect(postRes.body.rule.baseDeliveryFeePaise).toBe(4900);
    });
  });
});
