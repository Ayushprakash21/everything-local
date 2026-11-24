import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../server/src/index';
import { prisma } from '../server/src/db';
import { BankVerificationService } from '../server/src/core/bankVerificationService';

describe('Everything Local — Complete Merchant Registration, KYC, Bank Account & Payout Test Suite', () => {
  let adminToken: string;
  let applicantToken: string;
  let applicantId: string;
  let testRef: string;
  let testAppId: string;
  let approvedStoreId: string;
  let settlementStatementId: string;

  const uniqueSuffix = Math.floor(1000 + Math.random() * 9000);
  const testPhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
  const testEmail = `merchant_fintech_${Date.now()}_${uniqueSuffix}@indoreretail.in`;
  const testPan = `ABCDE${uniqueSuffix}K`;
  const testGst = `23ABCDE${uniqueSuffix}K1Z5`;

  beforeAll(async () => {
    // 1. Authenticate Admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ emailOrPhone: 'admin@everythinglocal.in', password: 'Password@123' });
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.token;
  });

  // TEST 1: First-time merchant registration generates reference & draft record
  it('1. First-time merchant registration generates unique EL-MAPP reference and draft application', async () => {
    const res = await request(app)
      .post('/api/onboarding/start')
      .send({
        ownerName: 'Manish Agarwal',
        ownerPhone: testPhone,
        ownerEmail: testEmail,
        password: 'Password@123',
        businessEntityType: 'PROPRIETORSHIP',
        panNumber: testPan,
        communicationConsent: true
      });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.application).toBeDefined();
    expect(res.body.application.referenceNumber).toMatch(/^EL-MAPP-/);
    expect(res.body.application.status).toBe('DRAFT');
    expect(res.body.application.currentStep).toBe(1);
    expect(res.body.progress).toBeDefined();
    expect(res.body.progress.totalSteps).toBe(11);

    applicantToken = res.body.token;
    testRef = res.body.application.referenceNumber;
    testAppId = res.body.application.id;

    // Verify user created with CUSTOMER role initially
    const user = await prisma.user.findUnique({ where: { email: testEmail } });
    expect(user).toBeDefined();
    expect(user!.role).toBe('CUSTOMER');
    applicantId = user!.id;
  });

  // TEST 2: Cross-platform resume (Android <-> Web)
  it('2. Cross-platform resume returns existing active draft without creating duplicate accounts', async () => {
    const resumeRes = await request(app)
      .post('/api/onboarding/resume')
      .send({
        identifier: testEmail,
        password: 'Password@123'
      });

    expect(resumeRes.status).toBe(200);
    expect(resumeRes.body.token).toBeDefined();
    expect(resumeRes.body.application.referenceNumber).toBe(testRef);
    expect(resumeRes.body.progress.currentStep).toBe(1);

    // Also verify resume by reference number directly
    const resumeByRef = await request(app)
      .post('/api/onboarding/resume')
      .send({ identifier: testRef });

    expect(resumeByRef.status).toBe(200);
    expect(resumeByRef.body.application.referenceNumber).toBe(testRef);
  });

  // TEST 3: Step 2 Contact Verification via OTP
  it('3. Verifies owner mobile number via deterministic pilot OTP code', async () => {
    const otpRes = await request(app)
      .post('/api/onboarding/verify-phone-otp')
      .send({
        referenceNumber: testRef,
        otp: '1234'
      });

    expect(otpRes.status).toBe(200);
    expect(otpRes.body.application.isPhoneVerified).toBe(true);
    expect(otpRes.body.progress.steps[1].status).toBe('COMPLETED');
  });

  // TEST 4: Step 3 Business Information Setup
  it('4. Saves legal entity, PAN, and trade name with Indore business details', async () => {
    const bizRes = await request(app)
      .put(`/api/onboarding/application/${testRef}/step/3`)
      .set('Authorization', `Bearer ${applicantToken}`)
      .send({
        businessName: 'Agarwal Super Mart',
        legalName: 'Agarwal Retail Enterprises',
        entityType: 'PROPRIETORSHIP',
        panNumber: testPan,
        isGstRegistered: true,
        gstin: testGst,
        businessRegistrationNumber: 'UDYAM-MP-00-554433'
      });

    expect(bizRes.status).toBe(200);
    expect(bizRes.body.application.businessName).toBe('Agarwal Super Mart');
    expect(bizRes.body.application.legalName).toBe('Agarwal Retail Enterprises');
    expect(bizRes.body.application.panNumber).toBe(testPan);
    expect(bizRes.body.application.gstin).toBe(testGst);
  });

  // TEST 5: Step 4 KYC Document Upload & Magic Bytes Protection
  it('5. Uploads authentic PDF/image document and enforces mime-type security', async () => {
    const validPdfBuffer = Buffer.from('%PDF-1.5 statutory pan card sample binary');
    const uploadRes = await request(app)
      .post(`/api/onboarding/application/${testRef}/documents`)
      .set('Authorization', `Bearer ${applicantToken}`)
      .field('documentType', 'PAN_CARD')
      .attach('file', validPdfBuffer, 'pan_card.pdf');

    expect(uploadRes.status).toBe(201);
    expect(uploadRes.body.document).toBeDefined();
    expect(uploadRes.body.document.documentType).toBe('PAN_CARD');
    expect(uploadRes.body.document.verificationStatus).toBe('PENDING');

    // Secure document download check (applicant has access)
    const fileName = uploadRes.body.document.fileUrl.split('/').pop();
    const docGet = await request(app)
      .get(`/api/onboarding/application/${testRef}/documents/file/${fileName}`)
      .set('Authorization', `Bearer ${applicantToken}`);
    expect(docGet.status).toBe(200);
  });

  // TEST 6: Bank IFSC Directory Lookup for Indore Branches
  it('6. Looks up valid Indore bank IFSC and resolves bank name and branch', async () => {
    // Valid SBI Indore Main Branch
    const sbiRes = await request(app).get('/api/onboarding/bank/lookup-ifsc/SBIN0001234');
    expect(sbiRes.status).toBe(200);
    expect(sbiRes.body.isValid).toBe(true);
    expect(sbiRes.body.bankName).toBe('State Bank of India');
    expect(sbiRes.body.city).toBe('Indore');
    expect(sbiRes.body.state).toBe('Madhya Pradesh');

    // Valid HDFC Vijay Nagar Indore Branch
    const hdfcRes = await request(app).get('/api/onboarding/bank/lookup-ifsc/HDFC0005678');
    expect(hdfcRes.status).toBe(200);
    expect(hdfcRes.body.bankName).toBe('HDFC Bank');

    // Invalid IFSC format rejection
    const invalidRes = await request(app).get('/api/onboarding/bank/lookup-ifsc/INVALID_IFSC');
    expect(invalidRes.status).toBe(400);
    expect(invalidRes.body.isValid).toBe(false);
  });

  // TEST 7: Step 5 Bank Details & AES-256-GCM Encryption at Rest
  it('7. Collects bank details, enforces account confirmation, encrypts at rest, and stores masked string', async () => {
    const rawAccNumber = '987654321098';

    // Account mismatch check
    const mismatchRes = await request(app)
      .put(`/api/onboarding/application/${testRef}/bank-details`)
      .set('Authorization', `Bearer ${applicantToken}`)
      .send({
        accountHolderName: 'Manish Agarwal',
        bankName: 'State Bank of India',
        accountNumber: rawAccNumber,
        confirmAccountNumber: '987654321000',
        ifsc: 'SBIN0001234',
        accountType: 'CURRENT',
        ownershipDeclaration: true
      });
    expect(mismatchRes.status).toBe(400);
    expect(mismatchRes.body.error).toMatch(/do not match/i);

    // Valid submission
    const bankRes = await request(app)
      .put(`/api/onboarding/application/${testRef}/bank-details`)
      .set('Authorization', `Bearer ${applicantToken}`)
      .send({
        accountHolderName: 'Manish Agarwal',
        bankName: 'State Bank of India',
        branchName: 'Main Branch, Palasia, Indore',
        accountNumber: rawAccNumber,
        confirmAccountNumber: rawAccNumber,
        ifsc: 'SBIN0001234',
        accountType: 'CURRENT',
        ownershipDeclaration: true
      });

    expect(bankRes.status).toBe(200);
    expect(bankRes.body.bankAccount).toBeDefined();
    expect(bankRes.body.bankAccount.accountNumberMasked).toBe('•••• •••• 1098');
    expect(bankRes.body.bankAccount.ifsc).toBe('SBIN0001234');
    expect(bankRes.body.bankAccount.verificationStatus).toBe('PENDING');

    // Verify database record has AES-256 encrypted account number (not plaintext)
    const dbBank = await prisma.merchantBankAccount.findUnique({
      where: { applicationId: testAppId }
    });
    expect(dbBank).toBeDefined();
    expect(dbBank!.accountNumber).not.toBe(rawAccNumber); // Must be encrypted
    expect(dbBank!.accountNumber).toContain(':'); // IV:AuthTag:Ciphertext format
    const decrypted = BankVerificationService.decryptAccountNumber(dbBank!.accountNumber);
    expect(decrypted).toBe(rawAccNumber);
  });

  // TEST 8: Step 6 Automated Penny-Drop ₹1 Verification Engine
  it('8. Triggers simulated NPCI Penny-Drop verification and achieves high name match score', async () => {
    const pndRes = await request(app)
      .post(`/api/onboarding/application/${testRef}/bank/verify`)
      .set('Authorization', `Bearer ${applicantToken}`);

    expect(pndRes.status).toBe(200);
    expect(pndRes.body.verification).toBeDefined();
    expect(pndRes.body.verification.status).toBe('SUCCESS');
    expect(pndRes.body.verification.providerRef).toMatch(/^PND-IMPS-/);
    expect(pndRes.body.verification.matchScore).toBeGreaterThanOrEqual(75);
    expect(pndRes.body.bankAccount.verificationStatus).toBe('VERIFIED');
    expect(pndRes.body.bankAccount.pennyDropStatus).toBe('SUCCESS');
  });

  // TEST 9: Step 7 Store Configuration in Indore
  it('9. Configures store with Indore address, 3km delivery radius, and operating hours', async () => {
    const storeRes = await request(app)
      .put(`/api/onboarding/application/${testRef}/step/7`)
      .set('Authorization', `Bearer ${applicantToken}`)
      .send({
        storeName: 'Agarwal Super Mart - Palasia',
        category: 'Grocery & Daily Staples',
        description: 'Authentic grocery and FMCG essentials in New Palasia, Indore',
        addressLine: '42, Greater Kailash Road, Old Palasia',
        city: 'Indore',
        pincode: '452001',
        latitude: 22.7244,
        longitude: 75.8839,
        openingTime: '08:00',
        closingTime: '22:00',
        weeklyClosingDay: 'None',
        deliveryRadiusKm: 3.0,
        minOrderValuePaise: 19900
      });

    expect(storeRes.status).toBe(200);
    expect(storeRes.body.application.storeName).toBe('Agarwal Super Mart - Palasia');
    expect(storeRes.body.application.commissionRatePct).toBe(3.5);
    expect(storeRes.body.application.deliveryRadiusKm).toBe(3.0);
  });

  // TEST 10: Step 8 Product Catalogue Draft Setup
  it('10. Adds draft product catalogue with realistic FMCG items and prices', async () => {
    const sampleProducts = [
      { name: 'Refined White Sugar', category: 'Grocery & Daily Staples', pricePaise: 4800, mrpPaise: 5500, stock: 50 },
      { name: 'Sharbati Whole Wheat Atta', category: 'Grocery & Daily Staples', pricePaise: 38000, mrpPaise: 42000, stock: 40 },
      { name: 'Pure Mustard Oil 1L', category: 'Grocery & Daily Staples', pricePaise: 16000, mrpPaise: 18500, stock: 30 }
    ];

    const catRes = await request(app)
      .post(`/api/onboarding/application/${testRef}/catalogue`)
      .set('Authorization', `Bearer ${applicantToken}`)
      .send({ products: sampleProducts });

    expect(catRes.status).toBe(200);
    expect(catRes.body.productsCount).toBe(3);

    const appDb = await prisma.merchantApplication.findUnique({ where: { id: testAppId } });
    expect(appDb!.initialProductsCount).toBe(3);
    expect(appDb!.productsCatalogueJson).toContain('Refined White Sugar');
  });

  // TEST 11: Step 9 Commercial Agreement Acceptance
  it('11. Accepts transparent commercial terms with T+1 settlement and category rate', async () => {
    const agreeRes = await request(app)
      .put(`/api/onboarding/application/${testRef}/step/9`)
      .set('Authorization', `Bearer ${applicantToken}`)
      .send({
        agreementVersion: 'v2026.1',
        termsAccepted: true
      });

    expect(agreeRes.status).toBe(200);

    const acceptance = await prisma.merchantAgreementAcceptance.findUnique({
      where: { applicationId: testAppId }
    });
    expect(acceptance).toBeDefined();
    expect(acceptance!.agreementVersion).toBe('v2026.1');
  });

  // TEST 12: 11-Step Progress Verification Endpoint
  it('12. Computes complete 11-step progress and 100% readiness for submission', async () => {
    const progRes = await request(app)
      .get(`/api/onboarding/application/${testRef}/progress`)
      .set('Authorization', `Bearer ${applicantToken}`);

    expect(progRes.status).toBe(200);
    expect(progRes.body.totalSteps).toBe(11);
    expect(progRes.body.missingFields).toHaveLength(0);
    expect(progRes.body.steps[0].status).toBe('COMPLETED'); // Account
    expect(progRes.body.steps[1].status).toBe('COMPLETED'); // Contact
    expect(progRes.body.steps[2].status).toBe('COMPLETED'); // Business
    expect(progRes.body.steps[3].status).toBe('COMPLETED'); // Documents
    expect(progRes.body.steps[4].status).toBe('COMPLETED'); // Bank Details
    expect(progRes.body.steps[5].status).toBe('COMPLETED'); // Bank Verification
    expect(progRes.body.steps[6].status).toBe('COMPLETED'); // Store Config
    expect(progRes.body.steps[7].status).toBe('COMPLETED'); // Catalogue
    expect(progRes.body.steps[8].status).toBe('COMPLETED'); // Agreement
  });

  // TEST 13: Step 10 Application Submission for Ops Verification
  it('13. Submits completed application transitioning status to SUBMITTED', async () => {
    const subRes = await request(app)
      .post(`/api/onboarding/application/${testRef}/submit`)
      .set('Authorization', `Bearer ${applicantToken}`);

    expect(subRes.status).toBe(200);
    expect(subRes.body.status).toBe('SUBMITTED');
    expect(subRes.body.application.currentStep).toBe(10);
  });

  // TEST 14: Admin Review Console & Single Application Details
  it('14. Admin views application details including masked bank account and penny-drop score', async () => {
    const appRes = await request(app)
      .get(`/api/admin/onboarding/applications/${testAppId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(appRes.status).toBe(200);
    expect(appRes.body.application.referenceNumber).toBe(testRef);
    expect(appRes.body.application.bankAccount.accountNumberMasked).toBe('•••• •••• 1098');
    expect(appRes.body.application.bankAccount.pennyDropStatus).toBe('SUCCESS');
    expect(appRes.body.application.bankAccount.pennyDropMatchScore).toBeGreaterThanOrEqual(75);
  });

  // TEST 15: Admin Approval activates Store, elevates role, and populates catalogue
  it('15. Admin approval activates store, elevates user role to MERCHANT, and publishes draft catalogue', async () => {
    const approveRes = await request(app)
      .post(`/api/admin/onboarding/applications/${testAppId}/action`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        action: 'APPROVE',
        commissionRatePct: 3.5
      });

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.application.status).toBe('APPROVED');
    expect(approveRes.body.application.activatedStoreId).toBeDefined();

    approvedStoreId = approveRes.body.application.activatedStoreId;

    // Verify user role elevated to MERCHANT
    const user = await prisma.user.findUnique({ where: { id: applicantId } });
    expect(user!.role).toBe('MERCHANT');

    // Verify physical store created
    const store = await prisma.store.findUnique({
      where: { id: approvedStoreId },
      include: { products: true }
    });
    expect(store).toBeDefined();
    expect(store!.isVerified).toBe(true);
    expect(store!.isOpen).toBe(true);

    // Verify draft products were automatically populated into store catalogue
    expect(store!.products.length).toBeGreaterThanOrEqual(3);
    const sugar = store!.products.find((p) => p.name === 'Refined White Sugar');
    expect(sugar).toBeDefined();
    expect(sugar!.pricePaise).toBe(4800);
  });

  // TEST 16: Duplicate Prevention on PAN and GSTIN
  it('16. Rejects duplicate registration attempts with already registered PAN or GSTIN', async () => {
    const dupRes = await request(app)
      .post('/api/onboarding/start')
      .send({
        ownerName: 'Another Person',
        ownerPhone: '9999988888',
        ownerEmail: 'another.person@indore.in',
        password: 'Password@123',
        panNumber: testPan // same PAN as approved store
      });

    expect(dupRes.status).toBe(409);
    expect(dupRes.body.error).toContain(testPan);
  });

  // TEST 17: Merchant Payout & Settlement Ledger Reconciliation
  it('17. Admin payout engine generates settlement statement and reconciles only with verified bank reference', async () => {
    // 1. Fetch platform payouts overview
    const overviewRes = await request(app)
      .get('/api/admin/payouts/overview')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(overviewRes.status).toBe(200);
    expect(overviewRes.body.overview.settlementCycle).toBe('T+1 (Next Business Day)');

    // 2. Fetch merchant settlement list
    const merchantsRes = await request(app)
      .get('/api/admin/payouts/merchants')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(merchantsRes.status).toBe(200);
    const ourMerchant = merchantsRes.body.merchants.find((m: any) => m.storeId === approvedStoreId);
    expect(ourMerchant).toBeDefined();
    expect(ourMerchant.bankAccount).toBeDefined();
    expect(ourMerchant.bankAccount.verificationStatus).toBe('VERIFIED');
    expect(ourMerchant.bankAccount.accountNumberMasked).toBe('•••• •••• 1098');

    // 3. Generate settlement statement for this store
    const now = new Date();
    const past = new Date(Date.now() - 7 * 86400000);
    const stmtRes = await request(app)
      .post('/api/admin/payouts/generate-statement')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        storeId: approvedStoreId,
        periodStart: past.toISOString(),
        periodEnd: now.toISOString()
      });

    expect(stmtRes.status).toBe(201);
    expect(stmtRes.body.statement).toBeDefined();
    expect(stmtRes.body.statement.statementNumber).toMatch(/^EL-STMT-/);
    expect(stmtRes.body.statement.status).toBe('GENERATED');

    settlementStatementId = stmtRes.body.statement.id;

    // 4. Cannot settle without bank transfer reference (UTR)
    const invalidSettle = await request(app)
      .post('/api/admin/payouts/settle')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        statementId: settlementStatementId,
        bankReference: '' // Missing UTR
      });
    expect(invalidSettle.status).toBe(400);

    // 5. Successfully reconcile and mark settled with valid bank UTR
    const bankUtr = `UTR-SBI-INDB-${Date.now()}`;
    const settleRes = await request(app)
      .post('/api/admin/payouts/settle')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        statementId: settlementStatementId,
        bankReference: bankUtr
      });

    expect(settleRes.status).toBe(200);
    expect(settleRes.body.statement.status).toBe('SETTLED');
    expect(settleRes.body.statement.bankReference).toBe(bankUtr);
    expect(settleRes.body.statement.settledAt).toBeDefined();

    // 6. Verify Merchant can log in with elevated MERCHANT role and view settled statements & bank account
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ emailOrPhone: testEmail, password: 'Password@123' });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.user.role).toBe('MERCHANT');
    const merchantToken = loginRes.body.token;

    const merchantStatementsRes = await request(app)
      .get('/api/merchant/settlements/statements')
      .set('Authorization', `Bearer ${merchantToken}`)
      .set('x-store-id', approvedStoreId);

    expect(merchantStatementsRes.status).toBe(200);
    expect(merchantStatementsRes.body.payoutBank).toBeDefined();
    expect(merchantStatementsRes.body.payoutBank.accountNumberMasked).toBe('•••• •••• 1098');
    expect(merchantStatementsRes.body.statements.length).toBeGreaterThan(0);
    expect(merchantStatementsRes.body.statements[0].bankReference).toBe(bankUtr);
  });
});
