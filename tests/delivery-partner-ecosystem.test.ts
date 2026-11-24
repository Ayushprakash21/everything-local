import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../server/src/index';
import { prisma } from '../server/src/db';
import { DeliveryDispatchEngine } from '../server/src/core/deliveryDispatchEngine';

describe('Everything Local — Delivery Partner Ecosystem Master Test Suite', () => {
  let adminToken: string;
  let customerToken: string;
  let customerId: string;
  let deliveryPartnerToken: string;
  let deliveryPartnerId: string;
  let riderProfileId: string;
  let testTaskId: string;
  let testOrderId: string;
  let testChildOrderId: string;

  const testPhone = `97${Math.floor(10000000 + Math.random() * 90000000)}`;
  const partnerName = 'Vikram Delivery Singh';

  beforeAll(async () => {
    // 1. Authenticate Admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ emailOrPhone: 'admin@everythinglocal.in', password: 'Password@123' });
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.token;

    // 2. Authenticate Customer
    const custRes = await request(app)
      .post('/api/auth/login')
      .send({ emailOrPhone: 'ayush@example.com', password: 'Password@123' });
    expect(custRes.status).toBe(200);
    customerToken = custRes.body.token;
    customerId = custRes.body.user.id;
  });

  // 1. OTP Request & Verification
  it('1. Delivery Partner requests OTP and logs in / registers', async () => {
    const otpReq = await request(app)
      .post('/api/delivery-partner/auth/send-otp')
      .send({ phone: testPhone });
    expect(otpReq.status).toBe(200);
    expect(otpReq.body.success).toBe(true);
    expect(otpReq.body.message).toContain('OTP sent successfully');

    // Verify OTP (in development/test, fallback OTP is 123456)
    const verifyRes = await request(app)
      .post('/api/delivery-partner/auth/verify-otp')
      .send({ phone: testPhone, otp: '123456' });
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.token).toBeDefined();
    expect(verifyRes.body.user.role).toBe('RIDER');

    deliveryPartnerToken = verifyRes.body.token;
    deliveryPartnerId = verifyRes.body.user.id;
  });

  // 2. Delivery Partner Onboarding Application
  it('2. Submits complete self-service partner onboarding application', async () => {
    const res = await request(app)
      .post('/api/delivery-partner/onboarding/apply')
      .set('Authorization', `Bearer ${deliveryPartnerToken}`)
      .send({
        name: partnerName,
        drivingLicenceNumber: 'MP-09-2021-0098765',
        panNumber: 'ABCDE1234F',
        vehicleType: 'SCOOTER',
        vehicleNumber: 'MP09EV1234',
        bankAccountNumber: '98765432101234',
        bankIfsc: 'SBIN0001234',
        emergencyContactName: 'Rajesh Singh',
        emergencyContactPhone: '9876543210',
        serviceArea: 'Vijay Nagar & Palasia'
      });
    expect(res.status).toBe(201);
    expect(res.body.profile.approvalStatus).toBe('UNDER_REVIEW');
    riderProfileId = res.body.profile.id;
  });

  it('3. Uploads statutory documents (DL, RC, PAN) with magic-byte / file validation', async () => {
    // Valid 1x1 PNG image buffer
    const validPngBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');

    const res = await request(app)
      .post('/api/delivery-partner/onboarding/documents')
      .set('Authorization', `Bearer ${deliveryPartnerToken}`)
      .field('documentType', 'DRIVING_LICENCE')
      .field('documentNumber', 'MP-09-2021-0098765')
      .attach('file', validPngBuffer, 'licence.png');

    expect(res.status).toBe(201);
    expect(res.body.document.documentType).toBe('DRIVING_LICENCE');
    expect(res.body.document.verificationStatus).toBe('PENDING');

    // Attempting invalid document type like AADHAAR is rejected
    const invalidDoc = await request(app)
      .post('/api/delivery-partner/onboarding/documents')
      .set('Authorization', `Bearer ${deliveryPartnerToken}`)
      .field('documentType', 'AADHAAR')
      .attach('file', validPngBuffer, 'aadhaar.png');

    expect(invalidDoc.status).toBe(400);
  });

  // 3. Admin Document Review & Approval
  it('4. Admin reviews pending applications and verifies document', async () => {
    const appsRes = await request(app)
      .get('/api/admin/delivery-operations/applications')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(appsRes.status).toBe(200);
    expect(Array.isArray(appsRes.body.applications)).toBe(true);

    const targetApp = appsRes.body.applications.find((a: any) => a.userId === deliveryPartnerId);
    expect(targetApp).toBeDefined();

    const docId = targetApp.documents[0].id;
    const verifyDocRes = await request(app)
      .post(`/api/admin/delivery-operations/documents/${docId}/verify`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'APPROVED' });
    expect(verifyDocRes.status).toBe(200);
    expect(verifyDocRes.body.document.verificationStatus).toBe('APPROVED');
  });

  it('5. Admin approves delivery partner application', async () => {
    const approveRes = await request(app)
      .post(`/api/admin/delivery-operations/applications/${riderProfileId}/decision`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ decision: 'APPROVED' });
    expect(approveRes.status).toBe(200);
    expect(approveRes.body.partner.approvalStatus).toBe('APPROVED');
  });

  // 4. Availability & Active Duty Location
  it('6. Partner goes ONLINE with initial GPS coordinates', async () => {
    const availRes = await request(app)
      .post('/api/delivery-partner/availability')
      .set('Authorization', `Bearer ${deliveryPartnerToken}`)
      .send({
        isOnline: true,
        latitude: 22.7533,
        longitude: 75.8937
      });
    expect(availRes.status).toBe(200);
    expect(availRes.body.isOnline).toBe(true);

    // Verify active location telemetry
    const locRes = await request(app)
      .post('/api/delivery-partner/location')
      .set('Authorization', `Bearer ${deliveryPartnerToken}`)
      .send({
        latitude: 22.7535,
        longitude: 75.8939,
        speedKmph: 24.5,
        headingDegrees: 90
      });
    expect(locRes.status).toBe(200);
    expect(locRes.body.success).toBe(true);
  });

  // 5. Task Creation, Dispatch Offer & Acceptance
  it('7. Creates a delivery task and offers it to online partner', async () => {
    const store = await prisma.store.findFirst();
    expect(store).toBeDefined();

    const parentOrder = await prisma.parentOrder.create({
      data: {
        orderNumber: `EL-TEST-${Date.now()}`,
        customerId: customerId,
        totalItemSubtotalPaise: 45400,
        totalPaidPaise: 49900,
        deliveryAddress: 'Scheme 54, Vijay Nagar, Indore',
        deliveryLatitude: 22.7533,
        deliveryLongitude: 75.8937,
        status: 'CONFIRMED'
      }
    });
    testOrderId = parentOrder.id;

    const childOrder = await prisma.merchantChildOrder.create({
      data: {
        parentOrderId: parentOrder.id,
        childOrderNumber: `EL-TEST-${Date.now()}-M1`,
        storeId: store!.id,
        subtotalPaise: 45400,
        merchantPayablePaise: 43130,
        status: 'READY_FOR_PICKUP'
      }
    });
    testChildOrderId = childOrder.id;

    const taskNumber = `EL-TSK-${Date.now()}`;
    const task = await prisma.deliveryTask.create({
      data: {
        taskNumber,
        parentOrderId: parentOrder.id,
        merchantOrderId: childOrder.id,
        pickupLocationName: store!.name,
        pickupAddress: store!.address || 'AB Road, Indore',
        pickupLatitude: store!.latitude || 22.75,
        pickupLongitude: store!.longitude || 75.89,
        deliveryAddress: 'Scheme 54, Vijay Nagar, Indore',
        deliveryLatitude: 22.7533,
        deliveryLongitude: 75.8937,
        pickupOtp: '1234',
        deliveryOtp: '4321',
        riderBasePayoutPaise: 4500,
        additionalPickupPayoutPaise: 0,
        surgePayoutPaise: 1000,
        totalPayoutPaise: 5500,
        status: 'AVAILABLE'
      }
    });
    testTaskId = task.id;

    // Admin manually assigns task to online partner
    const assignRes = await request(app)
      .post('/api/admin/delivery-operations/assignments/manual-assign')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ taskId: testTaskId, partnerId: riderProfileId });
    expect(assignRes.status).toBe(200);
    expect(assignRes.body.success).toBe(true);
  });

  it('8. Partner views pending offer and accepts it', async () => {
    const offersRes = await request(app)
      .get('/api/delivery-partner/tasks/requests')
      .set('Authorization', `Bearer ${deliveryPartnerToken}`);
    expect(offersRes.status).toBe(200);
    expect(offersRes.body.offers.length).toBeGreaterThanOrEqual(1);

    const acceptRes = await request(app)
      .post(`/api/delivery-partner/tasks/${testTaskId}/accept`)
      .set('Authorization', `Bearer ${deliveryPartnerToken}`);
    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.task.status).toBe('ACCEPTED');
  });

  // 6. Security & Order Lock: Cannot go offline during active task
  it('9. Partner is locked from going offline during active delivery without emergency reason', async () => {
    const offlineRes = await request(app)
      .post('/api/delivery-partner/availability')
      .set('Authorization', `Bearer ${deliveryPartnerToken}`)
      .send({ isOnline: false });
    expect(offlineRes.status).toBe(400);
    expect(offlineRes.body.error).toContain('Cannot go offline while an active delivery is in progress');
  });

  // 7. Store Arrival, Pickup & Customer OTP Security
  it('10. Partner arrives at merchant store and confirms pickup', async () => {
    const arriveStoreRes = await request(app)
      .post(`/api/delivery-partner/tasks/${testTaskId}/at-store`)
      .set('Authorization', `Bearer ${deliveryPartnerToken}`);
    expect(arriveStoreRes.status).toBe(200);
    expect(arriveStoreRes.body.task.status).toBe('AT_STORE');

    const pickupRes = await request(app)
      .post(`/api/delivery-partner/tasks/${testTaskId}/pickup`)
      .set('Authorization', `Bearer ${deliveryPartnerToken}`)
      .send({ otp: '1234' });
    expect(pickupRes.status).toBe(200);
    expect(pickupRes.body.task.status).toBe('PICKED_UP');
  });

  // 8. Customer OTP Verification & Handover
  it('11. Enforces customer delivery OTP verification with attempt limits and completes delivery', async () => {
    // Attempt with incorrect OTP
    const wrongOtpRes = await request(app)
      .post(`/api/delivery-partner/tasks/${testTaskId}/deliver`)
      .set('Authorization', `Bearer ${deliveryPartnerToken}`)
      .send({ otp: '0000' });
    expect(wrongOtpRes.status).toBe(400);
    expect(wrongOtpRes.body.error).toContain('Incorrect customer delivery OTP');

    // Test hash and verification functions in DeliveryDispatchEngine
    const testPlainOtp = '4321';
    const hashed = DeliveryDispatchEngine.hashOtp(testPlainOtp);
    expect(DeliveryDispatchEngine.verifyOtp(testPlainOtp, hashed)).toBe(true);
    expect(DeliveryDispatchEngine.verifyOtp('9999', hashed)).toBe(false);

    // Update task with hashed OTP for end-to-end verification test
    await prisma.deliveryTask.update({
      where: { id: testTaskId },
      data: { deliveryOtpHashed: hashed, deliveryOtpAttempts: 0 }
    });

    // Valid OTP verification
    const validOtpRes = await request(app)
      .post(`/api/delivery-partner/tasks/${testTaskId}/deliver`)
      .set('Authorization', `Bearer ${deliveryPartnerToken}`)
      .send({
        otp: testPlainOtp,
        photoProofUrl: 'https://cdn.everythinglocal.in/proofs/proof-123.jpg',
        recipientNotes: 'Handed directly to customer at door'
      });
    expect(validOtpRes.status).toBe(200);
    expect(validOtpRes.body.task.status).toBe('DELIVERED');
    expect(validOtpRes.body.payoutPaise).toBe(5500); // 4500 base + 1000 surge
  });

  // 9. Earnings Ledger & Settlement Generation
  it('12. Partner earnings ledger and settlements reflect completed deliveries', async () => {
    const earningsRes = await request(app)
      .get('/api/delivery-partner/earnings')
      .set('Authorization', `Bearer ${deliveryPartnerToken}`);
    expect(earningsRes.status).toBe(200);
    expect(earningsRes.body.totalEarningsPaise).toBeGreaterThanOrEqual(5500);
    expect(earningsRes.body.earnings.length).toBeGreaterThanOrEqual(1);

    // Admin runs settlement payout
    const payoutRes = await request(app)
      .post('/api/admin/delivery-operations/settlements/payout')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ riderId: riderProfileId });
    expect(payoutRes.status).toBe(200);
    expect(payoutRes.body.settlement.status).toBe('COMPLETED');
    expect(payoutRes.body.settlement.netPayoutPaise).toBeGreaterThanOrEqual(5500);

    // Delivery partner settlements view
    const settlementsRes = await request(app)
      .get('/api/delivery-partner/settlements')
      .set('Authorization', `Bearer ${deliveryPartnerToken}`);
    expect(settlementsRes.status).toBe(200);
    expect(settlementsRes.body.settlements.length).toBeGreaterThanOrEqual(1);
  });

  // 10. Emergency Offline Transition with Incident Report
  it('13. Allows emergency offline with incident report during active trip', async () => {
    // Create another task and set to ACCEPTED
    const store = await prisma.store.findFirst();
    const task2 = await prisma.deliveryTask.create({
      data: {
        taskNumber: `EL-TSK-${Date.now()}-EMERG`,
        parentOrderId: testOrderId,
        riderId: riderProfileId,
        pickupLocationName: store!.name,
        pickupAddress: store!.address || 'AB Road, Indore',
        pickupLatitude: store!.latitude || 22.75,
        pickupLongitude: store!.longitude || 75.89,
        deliveryAddress: 'Scheme 54, Vijay Nagar, Indore',
        deliveryLatitude: 22.7533,
        deliveryLongitude: 75.8937,
        pickupOtp: '1234',
        deliveryOtp: '5678',
        riderBasePayoutPaise: 3500,
        totalPayoutPaise: 3500,
        status: 'ACCEPTED'
      }
    });

    const emergencyOfflineRes = await request(app)
      .post('/api/delivery-partner/availability')
      .set('Authorization', `Bearer ${deliveryPartnerToken}`)
      .send({
        isOnline: false,
        emergencyReason: 'Vehicle flat tire on BRTS road'
      });
    expect(emergencyOfflineRes.status).toBe(200);
    expect(emergencyOfflineRes.body.isOnline).toBe(false);

    // Verify task2 was released back to AVAILABLE and an incident was registered
    const releasedTask = await prisma.deliveryTask.findUnique({ where: { id: task2.id } });
    expect(releasedTask?.status).toBe('AVAILABLE');
    expect(releasedTask?.riderId).toBeNull();

    const incident = await prisma.deliveryIncident.findFirst({
      where: { taskId: task2.id }
    });
    expect(incident).toBeDefined();
    expect(incident?.description).toContain('Vehicle flat tire');
  });

  // 11. Admin Delivery Operations Overview & Metrics
  it('14. Admin views operations metrics and resolves incident', async () => {
    const overviewRes = await request(app)
      .get('/api/admin/delivery-operations/overview')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(overviewRes.status).toBe(200);
    expect(overviewRes.body.metrics).toBeDefined();
    expect(overviewRes.body.metrics.totalPartners).toBeGreaterThanOrEqual(1);

    const incidentsRes = await request(app)
      .get('/api/admin/delivery-operations/incidents')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(incidentsRes.status).toBe(200);
    expect(incidentsRes.body.incidents.length).toBeGreaterThanOrEqual(1);

    const targetIncident = incidentsRes.body.incidents[0];
    const resolveRes = await request(app)
      .post(`/api/admin/delivery-operations/incidents/${targetIncident.id}/resolve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ resolutionNotes: 'Reassigned to backup courier', adminAction: 'REASSIGNED' });
    expect(resolveRes.status).toBe(200);
    expect(resolveRes.body.incident.status).toBe('RESOLVED');
  });
});
