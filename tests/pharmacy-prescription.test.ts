import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../server/src/index';
import { prisma } from '../server/src/db';
import path from 'path';
import fs from 'fs';

describe('Everything Local — Pharmacy & Medical Ecosystem with Secure Prescription Upload', () => {
  let customerToken: string;
  let customer2Token: string;
  let pharmacistToken: string;
  let regularMerchantToken: string;
  let adminToken: string;

  let apolloPharmacyId: string;
  let testPrescriptionId: string;
  let testDocId: string;
  let testQuotationId: string;
  let testOrderId: string;

  // Create temporary test files for uploads
  const fixturesDir = path.resolve(__dirname, 'fixtures');
  if (!fs.existsSync(fixturesDir)) {
    fs.mkdirSync(fixturesDir, { recursive: true });
  }

  // 1. Valid JPEG fixture (JPEG magic bytes FF D8 FF)
  const validJpegPath = path.join(fixturesDir, 'test_prescription_1.jpg');
  const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
  fs.writeFileSync(validJpegPath, jpegBuffer);

  // 2. Valid PDF fixture (PDF magic bytes %PDF)
  const validPdfPath = path.join(fixturesDir, 'test_prescription_2.pdf');
  const pdfBuffer = Buffer.from('%PDF-1.4\n%âãÏÓ\n1 0 obj\n<<\n/Title (Test Prescription)\n>>\nendobj\ntrailer\n<<\n>>\n%%EOF');
  fs.writeFileSync(validPdfPath, pdfBuffer);

  // 3. Fake JPG / Invalid file (plain text with .jpg extension)
  const fakeJpgPath = path.join(fixturesDir, 'fake_exploit.jpg');
  fs.writeFileSync(fakeJpgPath, 'MALICIOUS_NON_IMAGE_EXECUTABLE_TEXT_PAYLOAD');

  beforeAll(async () => {
    // 1. Authenticate Customer
    const custRes = await request(app)
      .post('/api/auth/login')
      .send({ emailOrPhone: 'ayush@example.com', password: 'Password@123' });
    customerToken = custRes.body.token;

    // 2. Create and authenticate a second customer to test authorization isolation
    const cust2Res = await request(app)
      .post('/api/auth/register')
      .send({
        email: `cust2_${Date.now()}@example.com`,
        name: 'Second Customer',
        password: 'Password@123',
        role: 'CUSTOMER'
      });
    customer2Token = cust2Res.body.token;

    // 3. Authenticate Registered Pharmacist (Pooja Verma, Apollo Pharmacy)
    const pharmRes = await request(app)
      .post('/api/auth/login')
      .send({ emailOrPhone: 'pooja.pharmacist@everythinglocal.in', password: 'Password@123' });
    pharmacistToken = pharmRes.body.token;

    // 4. Authenticate Regular Grocery Merchant (Sharma Kirana Store - not a pharmacy!)
    const merchRes = await request(app)
      .post('/api/auth/login')
      .send({ emailOrPhone: 'sharma.kirana@everythinglocal.in', password: 'Password@123' });
    regularMerchantToken = merchRes.body.token;

    // 5. Authenticate Admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ emailOrPhone: 'admin@everythinglocal.in', password: 'Password@123' });
    adminToken = adminRes.body.token;

    // 6. Fetch Apollo Pharmacy ID
    const pharmacy = await prisma.pharmacy.findFirst({
      where: { slug: 'apollo-pharmacy-palasia' }
    });
    expect(pharmacy).toBeDefined();
    apolloPharmacyId = pharmacy!.id;
  });

  // Test 1: Upload a prescription photograph (JPEG)
  it('Scenario 1: Customer uploads a prescription photograph (JPEG)', async () => {
    const res = await request(app)
      .post('/api/pharmacy/prescriptions/upload')
      .set('Authorization', `Bearer ${customerToken}`)
      .attach('documents', validJpegPath);

    expect(res.status).toBe(201);
    expect(res.body.documents).toBeDefined();
    expect(res.body.documents.length).toBe(1);
    expect(res.body.documents[0].fileType).toBe('image/jpeg');
    expect(res.body.documents[0].storagePath).toMatch(/^rx_/);
  });

  // Test 2: Upload a PDF prescription
  it('Scenario 2: Customer uploads a PDF prescription', async () => {
    const res = await request(app)
      .post('/api/pharmacy/prescriptions/upload')
      .set('Authorization', `Bearer ${customerToken}`)
      .attach('documents', validPdfPath);

    expect(res.status).toBe(201);
    expect(res.body.documents[0].fileType).toBe('application/pdf');
    expect(res.body.documents[0].storagePath).toMatch(/^rx_/);
  });

  // Test 3: Upload multiple pages (photo + PDF)
  let uploadedDocs: any[] = [];
  it('Scenario 3: Customer uploads multiple prescription pages', async () => {
    const res = await request(app)
      .post('/api/pharmacy/prescriptions/upload')
      .set('Authorization', `Bearer ${customerToken}`)
      .attach('documents', validJpegPath)
      .attach('documents', validPdfPath);

    expect(res.status).toBe(201);
    expect(res.body.documents.length).toBe(2);
    uploadedDocs = res.body.documents;
  });

  // Test 4: Invalid file type or fake extension is rejected
  it('Scenario 4: Invalid file type or fake content is rejected with 400', async () => {
    const res = await request(app)
      .post('/api/pharmacy/prescriptions/upload')
      .set('Authorization', `Bearer ${customerToken}`)
      .attach('documents', fakeJpgPath);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid content/i);
  });

  // Test 5: Customer submits prescription & views status
  it('Scenario 5: Customer submits prescription with patient details and views status', async () => {
    const submitRes = await request(app)
      .post('/api/pharmacy/prescriptions')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        pharmacyId: apolloPharmacyId,
        patientName: 'Sunita Sharma',
        patientAge: 48,
        patientGender: 'FEMALE',
        patientRelation: 'Parent',
        customerNotes: 'Please check if Augmentin 625 Duo is available.',
        deliveryAddress: 'Flat 302, Silver Springs, Palasia, Indore',
        deliveryType: 'HOME_DELIVERY',
        documents: uploadedDocs
      });

    expect(submitRes.status).toBe(201);
    expect(submitRes.body.prescription).toBeDefined();
    expect(submitRes.body.prescription.status).toBe('SUBMITTED');
    expect(submitRes.body.prescription.patientName).toBe('Sunita Sharma');
    expect(submitRes.body.prescription.documents.length).toBe(2);

    testPrescriptionId = submitRes.body.prescription.id;
    testDocId = submitRes.body.prescription.documents[0].id;

    // View in customer list
    const myRes = await request(app)
      .get('/api/pharmacy/prescriptions/my')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(myRes.status).toBe(200);
    expect(myRes.body.prescriptions.length).toBeGreaterThanOrEqual(1);
    expect(myRes.body.prescriptions[0].prescriptionNumber).toMatch(/^RX-/);
  });

  // Test 6: Pharmacy receives prescription in console
  it('Scenario 6: Assigned pharmacy receives new prescription in review queue', async () => {
    const queueRes = await request(app)
      .get('/api/pharmacy/console/prescriptions')
      .set('Authorization', `Bearer ${pharmacistToken}`);

    expect(queueRes.status).toBe(200);
    expect(queueRes.body.prescriptions).toBeDefined();
    const found = queueRes.body.prescriptions.find((p: any) => p.id === testPrescriptionId);
    expect(found).toBeDefined();
    expect(found.patientName).toBe('Sunita Sharma');
  });

  // Test 7: Unauthorized merchant (grocery store) cannot access prescription console
  it('Scenario 7: Unauthorized merchant without pharmacy credentials cannot access prescription queue', async () => {
    const queueRes = await request(app)
      .get('/api/pharmacy/console/prescriptions')
      .set('Authorization', `Bearer ${regularMerchantToken}`);

    expect(queueRes.status).toBe(403);
    expect(queueRes.body.error).toMatch(/Only authorized pharmacists/i);
  });

  // Test 8: Registered pharmacist reviews prescription and streams document securely
  it('Scenario 8: Registered pharmacist reviews document securely with audit event logging', async () => {
    // 1. Stream document securely
    const streamRes = await request(app)
      .get(`/api/pharmacy/prescriptions/${testPrescriptionId}/documents/${testDocId}/view`)
      .set('Authorization', `Bearer ${pharmacistToken}`);

    expect(streamRes.status).toBe(200);
    expect(streamRes.headers['content-type']).toBe('image/jpeg');

    // 2. Submit Review
    const reviewRes = await request(app)
      .post(`/api/pharmacy/console/prescriptions/${testPrescriptionId}/review`)
      .set('Authorization', `Bearer ${pharmacistToken}`)
      .send({
        decision: 'APPROVED',
        doctorVerified: true,
        validityVerified: true,
        notes: 'Prescription valid from Dr. Anil Gupta (MBBS, MD). Medicine Augmentin in stock.',
        pharmacistName: 'Pooja Verma, B.Pharm',
        pharmacistRegNo: 'MPPC-48291'
      });

    expect(reviewRes.status).toBe(200);
    expect(reviewRes.body.prescription.status).toBe('APPROVED');
    expect(reviewRes.body.review.pharmacistRegNo).toBe('MPPC-48291');
  });

  // Test 9: Pharmacist requests clarification / additional information
  it('Scenario 9: Pharmacist requests clarification when dosage is missing', async () => {
    // Create a temporary prescription to test clarification
    const subRes = await request(app)
      .post('/api/pharmacy/prescriptions')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        pharmacyId: apolloPharmacyId,
        patientName: 'Rahul Verma',
        patientAge: 25,
        patientGender: 'MALE',
        deliveryAddress: 'Vijay Nagar, Indore',
        documents: [uploadedDocs[0]]
      });

    const clarificationRxId = subRes.body.prescription.id;

    const reviewRes = await request(app)
      .post(`/api/pharmacy/console/prescriptions/${clarificationRxId}/review`)
      .set('Authorization', `Bearer ${pharmacistToken}`)
      .send({
        decision: 'INFO_REQUESTED',
        doctorVerified: true,
        validityVerified: false,
        notes: 'Please upload page with doctor stamp and dosage duration.',
        pharmacistName: 'Pooja Verma, B.Pharm',
        pharmacistRegNo: 'MPPC-48291'
      });

    expect(reviewRes.status).toBe(200);
    expect(reviewRes.body.prescription.status).toBe('ADDITIONAL_INFO_REQUIRED');
  });

  // Test 10: Pharmacist rejects an invalid prescription with reason
  it('Scenario 10: Pharmacist rejects invalid/expired prescription with statutory reason', async () => {
    // Create another prescription to test rejection
    const subRes = await request(app)
      .post('/api/pharmacy/prescriptions')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        patientName: 'Test Patient',
        patientAge: 30,
        patientGender: 'MALE',
        deliveryAddress: 'Palasia, Indore',
        documents: [uploadedDocs[0]]
      });

    const rejectedRxId = subRes.body.prescription.id;

    const rejectRes = await request(app)
      .post(`/api/pharmacy/console/prescriptions/${rejectedRxId}/review`)
      .set('Authorization', `Bearer ${pharmacistToken}`)
      .send({
        decision: 'REJECTED',
        rejectionReason: 'Prescription is older than 6 months and lacks valid medical council registration number.',
        pharmacistName: 'Pooja Verma, B.Pharm',
        pharmacistRegNo: 'MPPC-48291'
      });

    expect(rejectRes.status).toBe(200);
    expect(rejectRes.body.prescription.status).toBe('REJECTED');
    expect(rejectRes.body.prescription.rejectionReason).toMatch(/older than 6 months/i);
  });

  // Test 11: Pharmacist prepares quotation with partial medicine availability
  it('Scenario 11 & 12: Pharmacist prepares quotation with partial availability (Item A available, Item B out of stock)', async () => {
    const quotRes = await request(app)
      .post(`/api/pharmacy/console/prescriptions/${testPrescriptionId}/quotation`)
      .set('Authorization', `Bearer ${pharmacistToken}`)
      .send({
        items: [
          {
            medicineName: 'Augmentin 625 Duo Tablet',
            dosageStrength: '625mg',
            prescribedQuantity: 2,
            approvedQuantity: 2,
            unitPricePaise: 20100, // ₹201.00
            isAvailable: true
          },
          {
            medicineName: 'Special Dermatological Cream',
            dosageStrength: '50g',
            prescribedQuantity: 1,
            approvedQuantity: 0,
            unitPricePaise: 35000,
            isAvailable: false,
            substitutionNote: 'Out of stock at Palasia branch. Restocking tomorrow.'
          }
        ],
        deliveryFeePaise: 3000, // ₹30 delivery fee
        estimatedDeliveryMinutes: 25,
        pharmacistNotes: 'Item 1 is packaged and ready for immediate dispatch. Item 2 is currently unavailable.'
      });

    expect(quotRes.status).toBe(201);
    expect(quotRes.body.quotation).toBeDefined();
    expect(quotRes.body.quotation.status).toBe('PENDING_CUSTOMER');
    expect(quotRes.body.quotation.subtotalPaise).toBe(40200); // 2 * 20100
    expect(quotRes.body.quotation.items.length).toBe(2);

    testQuotationId = quotRes.body.quotation.id;

    // Verify prescription status moved to AWAITING_CUSTOMER_CONFIRMATION
    const rxCheck = await prisma.prescription.findUnique({ where: { id: testPrescriptionId } });
    expect(rxCheck?.status).toBe('AWAITING_CUSTOMER_CONFIRMATION');
  });

  // Test 13: Customer confirms quotation -> Pharmacy Order created
  it('Scenario 13: Customer confirms quotation and generates Pharmacy Order', async () => {
    const confirmRes = await request(app)
      .post(`/api/pharmacy/quotations/${testQuotationId}/confirm`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(confirmRes.status).toBe(201);
    expect(confirmRes.body.order).toBeDefined();
    expect(confirmRes.body.order.orderNumber).toMatch(/^RXORD-/);
    expect(confirmRes.body.order.status).toBe('CONFIRMED');

    testOrderId = confirmRes.body.order.id;

    const rx = await prisma.prescription.findUnique({ where: { id: testPrescriptionId } });
    expect(rx?.status).toBe('ORDER_CREATED');
  });

  // Test 14: Customer cancels a prescription before dispensing
  it('Scenario 14: Customer cancels a prescription before dispensing', async () => {
    // Submit a fresh prescription to cancel
    const subRes = await request(app)
      .post('/api/pharmacy/prescriptions')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        patientName: 'Cancel Test',
        patientAge: 32,
        patientGender: 'MALE',
        deliveryAddress: 'Palasia, Indore',
        documents: [uploadedDocs[0]]
      });

    const cancelRxId = subRes.body.prescription.id;

    const cancelRes = await request(app)
      .post(`/api/pharmacy/prescriptions/${cancelRxId}/cancel`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ reason: 'Purchased from local retail counter directly.' });

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.prescription.status).toBe('CANCELLED');
  });

  // Test 15: Dispensing order records statutory batch number, expiry date and pharmacist credentials
  it('Scenario 15: Dispensing order records batch number, expiry date and registered pharmacist credentials', async () => {
    const dispenseRes = await request(app)
      .post(`/api/pharmacy/console/orders/${testOrderId}/dispense`)
      .set('Authorization', `Bearer ${pharmacistToken}`)
      .send({
        pharmacistName: 'Pooja Verma, B.Pharm',
        pharmacistRegNo: 'MPPC-48291',
        records: [
          {
            medicineName: 'Augmentin 625 Duo Tablet',
            batchNumber: 'AUG-B2408',
            expiryDate: '10/2026',
            quantityDispensed: 2
          }
        ]
      });

    expect(dispenseRes.status).toBe(200);
    expect(dispenseRes.body.order.status).toBe('OUT_FOR_DELIVERY');
    expect(dispenseRes.body.order.dispensedByPharmacist).toContain('MPPC-48291');

    // Verify statutory dispensing record in DB
    const recs = await prisma.dispensingRecord.findMany({ where: { orderId: testOrderId } });
    expect(recs.length).toBe(1);
    expect(recs[0].batchNumber).toBe('AUG-B2408');
  });

  // Test 16: Customer cannot access another customer's prescription documents
  it('Scenario 16: Privacy guard blocks Customer B from viewing Customer A prescription documents', async () => {
    const streamRes = await request(app)
      .get(`/api/pharmacy/prescriptions/${testPrescriptionId}/documents/${testDocId}/view`)
      .set('Authorization', `Bearer ${customer2Token}`);

    expect(streamRes.status).toBe(403);
    expect(streamRes.body.error).toMatch(/Forbidden/i);
  });

  // Test 17: Prescription documents are not publicly accessible via static folder
  it('Scenario 17: Prescription documents cannot be accessed via static public URLs', async () => {
    // Attempt to access document via public static /uploads/ path
    const staticRes = await request(app).get(`/uploads/prescriptions/${uploadedDocs[0].storagePath}`);
    // Should be 404 since prescriptions are stored outside /uploads
    expect(staticRes.status).toBe(404);
  });
});
