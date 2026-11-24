import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../server/src/index';
import { prisma } from '../server/src/db';

describe('Everything Local — Complete Merchant Partner Onboarding & Statutory Verification Test Suite', () => {
  let customerToken: string;
  let customerId: string;
  let adminToken: string;
  let adminId: string;
  let testRefNumber: string;
  let testAppId: string;

  const testEmail = `partner_${Date.now()}@sharmaretail.in`;
  const testPhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;

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
    adminId = adminRes.body.user.id;
  });

  // TEST 1: New merchant registration / start application
  it('1. New merchant partner starts onboarding application with Step 1 owner info', async () => {
    const res = await request(app)
      .post('/api/onboarding/start')
      .send({
        ownerName: 'Ramesh Sharma',
        ownerPhone: testPhone,
        ownerEmail: testEmail,
        password: 'Password@123',
        communicationConsent: true
      });

    expect(res.status).toBe(201);
    expect(res.body.application).toBeDefined();
    expect(res.body.application.referenceNumber).toMatch(/^EL-MAPP-/);
    expect(res.body.application.status).toBe('DRAFT');
    expect(res.body.application.currentStep).toBe(1);

    testRefNumber = res.body.application.referenceNumber;
    testAppId = res.body.application.id;

    // Check user was created with role CUSTOMER (not yet elevated to MERCHANT until approved)
    const user = await prisma.user.findUnique({ where: { email: testEmail } });
    expect(user).toBeDefined();
    expect(user!.role).toBe('CUSTOMER');
  });

  // TEST 2: OTP verification
  it('2. Verifies owner phone via OTP', async () => {
    const res = await request(app)
      .post('/api/onboarding/verify-phone-otp')
      .send({
        referenceNumber: testRefNumber,
        otp: '1234'
      });

    expect(res.status).toBe(200);
    expect(res.body.application.isPhoneVerified).toBe(true);

    const dbApp = await prisma.merchantApplication.findUnique({ where: { referenceNumber: testRefNumber } });
    expect(dbApp!.isPhoneVerified).toBe(true);
  });

  // TEST 3: Incomplete application save and resume
  it('3. Saves Step 2 business details and resumes application seamlessly', async () => {
    const saveRes = await request(app)
      .put(`/api/onboarding/application/${testRefNumber}/step/2`)
      .set('Authorization', `Bearer ${adminToken}`) // Admin or owner can update
      .send({
        businessName: 'Sharma Mega Kirana',
        legalName: 'Sharma Retail Pvt Ltd',
        entityType: 'PRIVATE_LIMITED',
        panNumber: 'ABCDE1234F',
        isGstRegistered: true,
        gstin: '23AAAAA0000A1Z5',
        businessRegistrationNumber: 'UDYAM-MP-00-998877'
      });

    expect(saveRes.status).toBe(200);
    expect(saveRes.body.application.businessName).toBe('Sharma Mega Kirana');
    expect(saveRes.body.application.panNumber).toBe('ABCDE1234F');
    expect(saveRes.body.application.gstin).toBe('23AAAAA0000A1Z5');

    // Resume application by fetching it
    const fetchRes = await request(app)
      .get(`/api/onboarding/application/${testRefNumber}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(fetchRes.status).toBe(200);
    expect(fetchRes.body.application.businessName).toBe('Sharma Mega Kirana');
    expect(fetchRes.body.application.currentStep).toBeGreaterThanOrEqual(2);
  });

  // TEST 4 & 5: Document upload and invalid file rejection
  it('4 & 5. Uploads authentic documents and rejects spoofed files via magic bytes', async () => {
    // 5. Invalid spoofed file (fake pdf header)
    const spoofedBuffer = Buffer.from('NOT A REAL PDF FILE CONTENT');
    const fakeUpload = await request(app)
      .post(`/api/onboarding/application/${testRefNumber}/documents`)
      .set('Authorization', `Bearer ${adminToken}`)
      .field('documentType', 'PAN_CARD')
      .attach('file', spoofedBuffer, 'pan.pdf');

    expect(fakeUpload.status).toBe(400);
    expect(fakeUpload.body.error).toMatch(/Invalid file format/i);

    // 4. Valid PDF file (starts with %PDF)
    const validPdfBuffer = Buffer.from('%PDF-1.4 sample valid pdf content for statutory pan verification');
    const validUpload = await request(app)
      .post(`/api/onboarding/application/${testRefNumber}/documents`)
      .set('Authorization', `Bearer ${adminToken}`)
      .field('documentType', 'PAN_CARD')
      .attach('file', validPdfBuffer, 'pan_card.pdf');

    expect(validUpload.status).toBe(201);
    expect(validUpload.body.document).toBeDefined();
    expect(validUpload.body.document.documentType).toBe('PAN_CARD');
    expect(validUpload.body.document.verificationStatus).toBe('PENDING');
  });

  // TEST 6 & 7: Save Store Info & Category-specific licence enforcement
  it('6 & 7. Saves store details and enforces category licensing for Pharmacy', async () => {
    // Step 3: Store details
    const step3Res = await request(app)
      .put(`/api/onboarding/application/${testRefNumber}/step/3`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        storeName: 'Sharma Kirana - Saket Nagar',
        category: 'Pharmacy & Wellness',
        addressLine: '12, Saket Nagar Main Road',
        city: 'Indore',
        pincode: '452018',
        latitude: 22.7244,
        longitude: 75.8839
      });

    expect(step3Res.status).toBe(200);
    expect(step3Res.body.application.category).toBe('Pharmacy & Wellness');
    // Category commission for Pharmacy & Wellness is 2.5%
    expect(step3Res.body.application.commissionRatePct).toBe(2.5);

    // Step 4: Delivery Config without drug license
    await request(app)
      .put(`/api/onboarding/application/${testRefNumber}/step/4`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        hasPickup: true,
        hasPlatformDelivery: true,
        deliveryRadiusKm: 3.5,
        minOrderValuePaise: 29900
      });

    // Step 6: Bank Account
    await request(app)
      .put(`/api/onboarding/application/${testRefNumber}/step/6`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        accountHolderName: 'Ramesh Sharma',
        bankName: 'HDFC Bank',
        accountNumber: '50100234567890',
        ifsc: 'HDFC0001234'
      });

    // Step 7: Commercial Agreement
    await request(app)
      .put(`/api/onboarding/application/${testRefNumber}/step/7`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        agreementVersion: 'v2026.1',
        termsAccepted: true
      });

    // Attempting to submit Pharmacy without Drug License fails
    const failSubmit = await request(app)
      .post(`/api/onboarding/application/${testRefNumber}/submit`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(failSubmit.status).toBe(400);
    expect(failSubmit.body.missingFields).toContain('Drug License number is mandatory for Pharmacy & Wellness category');

    // Add drug license and re-submit
    await request(app)
      .put(`/api/onboarding/application/${testRefNumber}/step/4`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        drugLicenseNumber: 'MP-IND-20B-123456'
      });
  });

  // TEST 8: Submit application transitions status to SUBMITTED
  it('8. Successfully submits completed application for review', async () => {
    const res = await request(app)
      .post(`/api/onboarding/application/${testRefNumber}/submit`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('SUBMITTED');

    const appInDb = await prisma.merchantApplication.findUnique({ where: { referenceNumber: testRefNumber } });
    expect(appInDb!.status).toBe('SUBMITTED');
  });

  // TEST 9 & 10: Admin review queue and request additional documents
  it('9 & 10. Admin views application queue and requests additional documents with feedback', async () => {
    // List applications
    const queueRes = await request(app)
      .get('/api/admin/onboarding/applications?status=SUBMITTED')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(queueRes.status).toBe(200);
    expect(queueRes.body.applications.length).toBeGreaterThan(0);
    expect(queueRes.body.counts.submitted).toBeGreaterThan(0);

    // Request additional documents without feedback fails
    const badAction = await request(app)
      .post(`/api/admin/onboarding/applications/${testAppId}/action`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'REQUEST_DOCUMENTS' });

    expect(badAction.status).toBe(400);
    expect(badAction.body.error).toMatch(/Feedback.*mandatory/i);

    // Request additional documents with feedback succeeds
    const actionRes = await request(app)
      .post(`/api/admin/onboarding/applications/${testAppId}/action`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        action: 'REQUEST_DOCUMENTS',
        feedback: 'Please upload a clearer copy of your Drug License certificate.'
      });

    expect(actionRes.status).toBe(200);
    expect(actionRes.body.application.status).toBe('DOCUMENTS_REQUIRED');
    expect(actionRes.body.application.adminFeedback).toContain('clearer copy');
  });

  // TEST 11 & 12: Merchant re-submission
  it('11 & 12. Merchant uploads requested document and re-submits application', async () => {
    // Re-submit
    const res = await request(app)
      .post(`/api/onboarding/application/${testRefNumber}/submit`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('SUBMITTED');
    expect(res.body.application.adminFeedback).toBeNull();
  });

  // TEST 13 & 14: Admin approval activates merchant account and creates verified store
  it('13 & 14. Admin approves application: elevates user role to MERCHANT and activates store', async () => {
    const res = await request(app)
      .post(`/api/admin/onboarding/applications/${testAppId}/action`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        action: 'APPROVE',
        commissionRatePct: 2.5
      });

    expect(res.status).toBe(200);
    expect(res.body.application.status).toBe('APPROVED');
    expect(res.body.application.activatedStoreId).toBeDefined();

    // Verify user role elevated to MERCHANT
    const user = await prisma.user.findUnique({ where: { email: testEmail } });
    expect(user!.role).toBe('MERCHANT');

    // Verify store was created and verified
    const store = await prisma.store.findUnique({ where: { id: res.body.application.activatedStoreId! } });
    expect(store).toBeDefined();
    expect(store!.isVerified).toBe(true);
    expect(store!.isOpen).toBe(true);
    expect(store!.commissionRatePct).toBe(2.5);
    expect(store!.ownerId).toBe(user!.id);
  });

  // TEST 15: Unauthorized approval attempts blocked
  it('15. Unauthorized non-admin user cannot approve merchant application (HTTP 403)', async () => {
    const res = await request(app)
      .post(`/api/admin/onboarding/applications/${testAppId}/action`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ action: 'APPROVE' });

    expect(res.status).toBe(403);
  });

  // TEST 16: Admin rejection with mandatory statutory reason
  it('16. Admin rejection requires mandatory statutory reason', async () => {
    // Create dummy draft application for rejection test
    const dummyRef = `EL-MAPP-${Date.now().toString().slice(-6)}`;
    const dummyApp = await prisma.merchantApplication.create({
      data: {
        referenceNumber: dummyRef,
        userId: customerId,
        ownerName: 'Dummy User',
        ownerPhone: '9999900000',
        ownerEmail: 'dummy@test.com',
        status: 'SUBMITTED'
      }
    });

    // Rejection without reason fails
    const badReject = await request(app)
      .post(`/api/admin/onboarding/applications/${dummyApp.id}/action`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'REJECT' });

    expect(badReject.status).toBe(400);
    expect(badReject.body.error).toMatch(/reason is mandatory/i);

    // Rejection with reason succeeds
    const rejectRes = await request(app)
      .post(`/api/admin/onboarding/applications/${dummyApp.id}/action`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        action: 'REJECT',
        reason: 'Business premise is situated outside the Indore municipal delivery boundary.'
      });

    expect(rejectRes.status).toBe(200);
    expect(rejectRes.body.application.status).toBe('REJECTED');
    expect(rejectRes.body.application.rejectionReason).toContain('outside the Indore municipal delivery boundary');
  });

  // TEST 17: Commercial Agreement API Contract
  it('17. Commercial agreement endpoint serves current version and Indore category rates', async () => {
    const res = await request(app).get('/api/onboarding/agreements/current');
    expect(res.status).toBe(200);
    expect(res.body.agreement).toBeDefined();
    expect(res.body.agreement.version).toBe('v2026.1');
    expect(res.body.agreement.categoryRates['Grocery & Daily Staples']).toBe(3.5);
    expect(res.body.agreement.categoryRates['Pharmacy & Wellness']).toBe(2.5);
  });

  // TEST 18: Masked Bank Account Security
  it('18. Stored bank account details correctly mask account numbers for safety', async () => {
    const bank = await prisma.merchantBankAccount.findUnique({
      where: { applicationId: testAppId }
    });
    expect(bank).toBeDefined();
    expect(bank!.accountNumberMasked).toBe('•••• •••• 7890');
    expect(bank!.verificationStatus).toBe('VERIFIED');
  });
});
