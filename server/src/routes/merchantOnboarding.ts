import { Router, Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { prisma } from '../db';
import { authenticateToken, generateToken } from '../middleware/auth';
import { detectImageMagicBytes } from './upload';
import { BankVerificationService } from '../core/bankVerificationService';

const router = Router();

// Configure protected document storage directory
const SECURE_DOCS_DIR = path.resolve(__dirname, '../../uploads/documents');
if (!fs.existsSync(SECURE_DOCS_DIR)) {
  fs.mkdirSync(SECURE_DOCS_DIR, { recursive: true });
}

// Memory upload for validation
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB limit
});

// Category commission map
export const CATEGORY_COMMISSION_RATES: Record<string, number> = {
  'Grocery & Daily Staples': 3.5,
  'Fresh Fruits & Vegetables': 4.0,
  'Dairy, Bread & Eggs': 3.0,
  'Bakery, Sweets & Namkeen': 4.5,
  'Personal Care & Household': 5.0,
  'Pharmacy & Wellness': 2.5,
  'Meat, Fish & Frozen Foods': 5.0,
  'Electronics & Electricals': 6.0,
  'Stationery & Books': 4.0,
  'Apparel & Footwear': 7.5,
  'Home & Kitchen': 5.5,
  'General': 3.5
};

// 11 Step Titles
export const ONBOARDING_STEPS = [
  { step: 1, id: 'account_registration', title: 'Account Registration' },
  { step: 2, id: 'contact_verification', title: 'Contact Verification' },
  { step: 3, id: 'business_info', title: 'Business Information' },
  { step: 4, id: 'kyc_documents', title: 'KYC Documents' },
  { step: 5, id: 'bank_details', title: 'Bank Details & Payout Setup' },
  { step: 6, id: 'bank_verification', title: 'Bank Verification (Penny-Drop)' },
  { step: 7, id: 'store_configuration', title: 'Store Configuration' },
  { step: 8, id: 'product_catalogue', title: 'Product Catalogue Setup' },
  { step: 9, id: 'merchant_agreement', title: 'Merchant Commercial Agreement' },
  { step: 10, id: 'admin_review', title: 'Admin Verification & Review' },
  { step: 11, id: 'store_activation', title: 'Store Activation & Payout Ready' }
];

/**
 * Computes status and completion percentage for all 11 steps
 */
export function calculateApplicationProgress(app: any) {
  const missingFields: string[] = [];
  const rejectedDocs: any[] = [];

  // Step 1: Account Registration
  const step1Done = Boolean(app.ownerName && app.ownerPhone && app.ownerEmail);
  if (!step1Done) missingFields.push('Owner Name, Phone, and Email');

  // Step 2: Contact Verification
  const step2Done = Boolean(app.isPhoneVerified);
  if (!step2Done) missingFields.push('Phone verification via OTP');

  // Step 3: Business Information
  const step3Done = Boolean(app.businessName && app.legalName && app.panNumber);
  if (!step3Done) missingFields.push('Business Name, Legal Name, and PAN');

  // Step 4: KYC Documents
  const docs = app.documents || [];
  const hasRejectedDocs = docs.some((d: any) => ['REJECTED', 'RESUBMISSION_REQUIRED'].includes(d.verificationStatus));
  docs.forEach((d: any) => {
    if (['REJECTED', 'RESUBMISSION_REQUIRED'].includes(d.verificationStatus)) {
      rejectedDocs.push({
        id: d.id,
        type: d.documentType,
        fileName: d.fileName,
        reason: d.rejectionReason || d.adminComment || 'Document rejected during compliance review'
      });
    }
  });
  const step4Done = docs.length > 0 && !hasRejectedDocs;
  if (docs.length === 0) missingFields.push('Statutory KYC Documents (PAN / Business Registration)');

  // Step 5: Bank Details
  const bank = app.bankAccount;
  const step5Done = Boolean(bank && bank.accountNumberMasked && bank.ifsc);
  if (!step5Done) missingFields.push('Bank Account Number, IFSC, and Account Holder Name');

  // Step 6: Bank Verification
  const step6Done = Boolean(bank && (bank.verificationStatus === 'VERIFIED' || bank.pennyDropStatus === 'SUCCESS'));

  // Step 7: Store Configuration
  const step7Done = Boolean(app.storeName && app.addressLine && app.pincode);
  if (!step7Done) missingFields.push('Store Name, Address, and Pincode');

  // Step 8: Product Catalogue
  let catalogueItemsCount = app.initialProductsCount || 0;
  if (catalogueItemsCount === 0 && app.productsCatalogueJson) {
    try {
      const parsed = JSON.parse(app.productsCatalogueJson);
      catalogueItemsCount = Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      catalogueItemsCount = 0;
    }
  }
  const step8Done = catalogueItemsCount > 0;

  // Step 9: Merchant Agreement
  const step9Done = Boolean(app.agreementAcceptance && app.agreementAcceptance.acceptedAt);
  if (!step9Done) missingFields.push('Merchant Commercial Agreement acceptance');

  // Step 10: Admin Review
  const step10Done = ['APPROVED', 'ACTIVE'].includes(app.status);
  const step10UnderReview = app.status === 'SUBMITTED' || app.status === 'UNDER_REVIEW';

  // Step 11: Store Activation
  const step11Done = Boolean(app.activatedStoreId || app.activatedStore);

  const stepsStatus = [
    {
      step: 1,
      title: 'Account Registration',
      status: step1Done ? 'COMPLETED' : 'IN_PROGRESS',
      isCurrent: app.currentStep === 1
    },
    {
      step: 2,
      title: 'Contact Verification',
      status: step2Done ? 'COMPLETED' : 'PENDING',
      isCurrent: app.currentStep === 2
    },
    {
      step: 3,
      title: 'Business Information',
      status: step3Done ? 'COMPLETED' : (step2Done ? 'IN_PROGRESS' : 'PENDING'),
      isCurrent: app.currentStep === 3
    },
    {
      step: 4,
      title: 'KYC Documents',
      status: hasRejectedDocs ? 'ACTION_REQUIRED' : (step4Done ? 'COMPLETED' : (step3Done ? 'IN_PROGRESS' : 'PENDING')),
      isCurrent: app.currentStep === 4,
      rejectedDocs
    },
    {
      step: 5,
      title: 'Bank Details & Payout Setup',
      status: step5Done ? 'COMPLETED' : (step4Done ? 'IN_PROGRESS' : 'PENDING'),
      isCurrent: app.currentStep === 5
    },
    {
      step: 6,
      title: 'Bank Verification (Penny-Drop)',
      status: step6Done ? 'COMPLETED' : (bank?.pennyDropStatus === 'FAILED' ? 'ACTION_REQUIRED' : (bank?.pennyDropStatus === 'MANUAL_REVIEW' ? 'UNDER_REVIEW' : (step5Done ? 'IN_PROGRESS' : 'PENDING'))),
      isCurrent: app.currentStep === 6,
      pennyDropStatus: bank?.pennyDropStatus || 'NOT_INITIATED',
      verificationStatus: bank?.verificationStatus || 'NOT_ADDED'
    },
    {
      step: 7,
      title: 'Store Configuration',
      status: step7Done ? 'COMPLETED' : (step6Done ? 'IN_PROGRESS' : 'PENDING'),
      isCurrent: app.currentStep === 7
    },
    {
      step: 8,
      title: 'Product Catalogue Setup',
      status: step8Done ? 'COMPLETED' : (step7Done ? 'IN_PROGRESS' : 'PENDING'),
      isCurrent: app.currentStep === 8,
      initialProductsCount: catalogueItemsCount
    },
    {
      step: 9,
      title: 'Merchant Commercial Agreement',
      status: step9Done ? 'COMPLETED' : (step8Done ? 'IN_PROGRESS' : 'PENDING'),
      isCurrent: app.currentStep === 9
    },
    {
      step: 10,
      title: 'Admin Verification & Review',
      status: step10Done ? 'COMPLETED' : (step10UnderReview ? 'UNDER_REVIEW' : (app.status === 'DOCUMENTS_REQUIRED' ? 'ACTION_REQUIRED' : (app.status === 'REJECTED' ? 'REJECTED' : 'PENDING'))),
      isCurrent: app.currentStep === 10
    },
    {
      step: 11,
      title: 'Store Activation & Payout Ready',
      status: step11Done ? 'COMPLETED' : (step10Done ? 'IN_PROGRESS' : 'PENDING'),
      isCurrent: app.currentStep === 11,
      storeId: app.activatedStoreId || null
    }
  ];

  const completedCount = stepsStatus.filter((s) => s.status === 'COMPLETED').length;
  const completionPct = Math.min(100, Math.round((completedCount / 11) * 100));

  return {
    currentStep: app.currentStep,
    status: app.status,
    completionPct,
    completedStepsCount: completedCount,
    totalSteps: 11,
    steps: stepsStatus,
    missingFields,
    hasRejectedDocuments: rejectedDocs.length > 0,
    rejectedDocuments: rejectedDocs
  };
}

// 1. Current Commercial Agreement Details
router.get('/agreements/current', (_req: Request, res: Response): void => {
  res.json({
    agreement: {
      version: 'v2026.1',
      title: 'Everything Local Merchant Partner Commercial Agreement (Indore)',
      effectiveFrom: '2026-01-01',
      settlementFrequency: 'T+1 (Next Business Day)',
      standardListingFeePaise: 0,
      categoryRates: CATEGORY_COMMISSION_RATES,
      terms: [
        'Merchant agrees to keep price parity with in-store offline prices.',
        'Orders must be packed and marked ready within the agreed prep time.',
        'Platform commission will be automatically deducted from settlement transfers.',
        'Returns due to expired, damaged, or counterfeit goods are the merchant’s responsibility.',
        'Customer personal details must only be used for order fulfilment.'
      ]
    }
  });
});

// 2. IFSC Directory Lookup
router.get('/bank/lookup-ifsc/:ifsc', (req: Request, res: Response): void => {
  const { ifsc } = req.params;
  const result = BankVerificationService.lookupIfsc(ifsc);
  if (!result.isValid) {
    res.status(400).json(result);
    return;
  }
  res.json(result);
});

// 3. Step 1: Start Onboarding Application with Duplicate Prevention
const StartOnboardingSchema = z.object({
  ownerName: z.string().min(2, 'Owner name must be at least 2 characters'),
  ownerPhone: z.string().min(10, 'Valid 10-digit mobile number required'),
  ownerEmail: z.string().email('Valid email address required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  businessEntityType: z.string().optional(),
  panNumber: z.string().optional(),
  gstin: z.string().optional(),
  communicationConsent: z.boolean().default(true)
});

router.post('/start', async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = StartOnboardingSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: 'Validation failed', details: parse.error.errors });
      return;
    }

    const {
      ownerName,
      ownerPhone,
      ownerEmail,
      password,
      businessEntityType,
      panNumber,
      gstin,
      communicationConsent
    } = parse.data;

    // Duplicate Check: Check if PAN or GSTIN is already registered to an approved store
    if (panNumber) {
      const cleanPan = panNumber.trim().toUpperCase();
      const existingPan = await prisma.merchantApplication.findFirst({
        where: {
          panNumber: cleanPan,
          status: { in: ['APPROVED', 'ACTIVE'] }
        }
      });
      if (existingPan) {
        res.status(409).json({
          error: `The PAN number ${cleanPan} is already registered to an approved store merchant.`
        });
        return;
      }
    }

    if (gstin) {
      const cleanGst = gstin.trim().toUpperCase();
      const existingGst = await prisma.merchantApplication.findFirst({
        where: {
          gstin: cleanGst,
          status: { in: ['APPROVED', 'ACTIVE'] }
        }
      });
      if (existingGst) {
        res.status(409).json({
          error: `The GSTIN ${cleanGst} is already registered to an approved store merchant.`
        });
        return;
      }
    }

    // Check if user already exists
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ email: ownerEmail }, { phone: ownerPhone }]
      }
    });

    let token = '';

    if (!user) {
      const passwordHash = await bcrypt.hash(password, 10);
      user = await prisma.user.create({
        data: {
          name: ownerName,
          email: ownerEmail,
          phone: ownerPhone,
          passwordHash,
          role: 'CUSTOMER' // Elevated to MERCHANT upon application approval
        }
      });
    }

    token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role as any
    });

    // Check for existing active or draft application
    let application = await prisma.merchantApplication.findFirst({
      where: {
        userId: user.id,
        status: { notIn: ['REJECTED', 'WITHDRAWN'] }
      },
      include: {
        documents: true,
        bankAccount: true,
        agreementAcceptance: true,
        activatedStore: true
      }
    });

    if (!application) {
      const refNum = `EL-MAPP-${Date.now().toString().slice(-6)}`;
      application = await prisma.merchantApplication.create({
        data: {
          referenceNumber: refNum,
          userId: user.id,
          ownerName,
          ownerPhone,
          ownerEmail,
          entityType: businessEntityType || 'PROPRIETORSHIP',
          panNumber: panNumber ? panNumber.toUpperCase() : null,
          gstin: gstin ? gstin.toUpperCase() : null,
          communicationConsent,
          isPhoneVerified: false,
          isEmailVerified: false,
          status: 'DRAFT',
          currentStep: 1,
          completionPct: 9
        },
        include: {
          documents: true,
          bankAccount: true,
          agreementAcceptance: true,
          activatedStore: true
        }
      });

      await prisma.merchantOnboardingHistory.create({
        data: {
          applicationId: application.id,
          fromStatus: 'INITIAL',
          toStatus: 'DRAFT',
          actorRole: 'MERCHANT',
          actorId: user.id,
          notes: 'Merchant onboarding application initialized'
        }
      });
    }

    const progress = calculateApplicationProgress(application);

    res.status(201).json({
      message: 'Onboarding application initiated successfully',
      token,
      application,
      progress
    });
  } catch (error) {
    console.error('Start onboarding error:', error);
    res.status(500).json({ error: 'Internal server error starting onboarding' });
  }
});

// 4. Resume Onboarding Application (Cross-Platform Continuity: Android <-> Web)
const ResumeOnboardingSchema = z.object({
  identifier: z.string().min(3, 'Email, phone, or application reference is required'),
  password: z.string().optional()
});

router.post('/resume', async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = ResumeOnboardingSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: 'Validation failed', details: parse.error.errors });
      return;
    }

    const { identifier, password } = parse.data;

    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { phone: identifier }
        ]
      }
    });

    let application = null;

    if (user) {
      if (password) {
        const matches = await bcrypt.compare(password, user.passwordHash);
        if (!matches) {
          res.status(401).json({ error: 'Invalid credentials. Password does not match.' });
          return;
        }
      }

      application = await prisma.merchantApplication.findFirst({
        where: {
          userId: user.id,
          status: { notIn: ['REJECTED', 'WITHDRAWN'] }
        },
        include: {
          documents: true,
          bankAccount: true,
          agreementAcceptance: true,
          history: { orderBy: { timestamp: 'desc' } },
          activatedStore: true
        }
      });
    } else {
      // Try finding by reference number directly
      application = await prisma.merchantApplication.findUnique({
        where: { referenceNumber: identifier },
        include: {
          user: true,
          documents: true,
          bankAccount: true,
          agreementAcceptance: true,
          history: { orderBy: { timestamp: 'desc' } },
          activatedStore: true
        }
      });

      if (application) {
        user = application.user;
      }
    }

    if (!application || !user) {
      res.status(404).json({ error: 'No active onboarding application found for the provided details.' });
      return;
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role as any
    });

    const progress = calculateApplicationProgress(application);

    res.json({
      message: 'Onboarding session resumed successfully',
      token,
      application,
      progress
    });
  } catch (error) {
    console.error('Resume onboarding error:', error);
    res.status(500).json({ error: 'Failed to resume onboarding session' });
  }
});

interface OnboardingOtpRecord {
  otp: string;
  expiresAt: Date;
  attempts: number;
  lastSentAt: number;
}
const merchantOtpStore = new Map<string, OnboardingOtpRecord>();

// 5a. Request Phone OTP
router.post('/send-phone-otp', async (req: Request, res: Response): Promise<void> => {
  try {
    const { referenceNumber } = req.body;
    if (!referenceNumber) {
      res.status(400).json({ error: 'Reference number is required' });
      return;
    }

    const application = await prisma.merchantApplication.findUnique({
      where: { referenceNumber }
    });
    if (!application) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    const now = Date.now();
    const existing = merchantOtpStore.get(referenceNumber);
    if (existing && now - existing.lastSentAt < 30000) {
      const waitSeconds = Math.ceil((30000 - (now - existing.lastSentAt)) / 1000);
      res.status(429).json({ error: `Please wait ${waitSeconds} seconds before requesting a new OTP` });
      return;
    }

    const isTest = process.env.NODE_ENV === 'test';
    const otp = isTest ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    merchantOtpStore.set(referenceNumber, {
      otp,
      expiresAt,
      attempts: 0,
      lastSentAt: now
    });

    res.json({
      success: true,
      message: 'Verification OTP sent to registered mobile number',
      devOtp: isTest ? otp : undefined
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// 5b. Verify Phone OTP
router.post('/verify-phone-otp', async (req: Request, res: Response): Promise<void> => {
  try {
    const { referenceNumber, otp } = req.body;
    if (!referenceNumber || !otp) {
      res.status(400).json({ error: 'Reference number and OTP are required' });
      return;
    }

    const application = await prisma.merchantApplication.findUnique({
      where: { referenceNumber },
      include: {
        documents: true,
        bankAccount: true,
        agreementAcceptance: true
      }
    });

    if (!application) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    const record = merchantOtpStore.get(referenceNumber);
    const isTest = process.env.NODE_ENV === 'test';
    const isTestCode = (otp === '123456' || otp === '1234' || otp === '0000');

    if (isTestCode && !isTest) {
      res.status(400).json({ error: 'Test verification codes are strictly prohibited in production' });
      return;
    }

    if (record) {
      if (record.attempts >= 5) {
        merchantOtpStore.delete(referenceNumber);
        res.status(429).json({ error: 'Maximum OTP verification attempts exceeded. Please request a new OTP.' });
        return;
      }

      if (record.expiresAt < new Date()) {
        merchantOtpStore.delete(referenceNumber);
        res.status(400).json({ error: 'OTP has expired. Please request a new verification code.' });
        return;
      }

      const isMatch = (record.otp === otp) || (isTest && isTestCode);
      if (!isMatch) {
        record.attempts += 1;
        const remaining = 5 - record.attempts;
        res.status(400).json({ error: `Invalid verification code. ${remaining} attempt(s) remaining.` });
        return;
      }

      // Success - delete OTP immediately (single-use)
      merchantOtpStore.delete(referenceNumber);
    } else {
      if (!isTest || !isTestCode) {
        res.status(400).json({ error: 'No active OTP found. Please request an OTP first.' });
        return;
      }
    }

    const updated = await prisma.merchantApplication.update({
      where: { id: application.id },
      data: {
        isPhoneVerified: true,
        currentStep: Math.max(application.currentStep, 2)
      },
      include: {
        documents: true,
        bankAccount: true,
        agreementAcceptance: true
      }
    });

    const progress = calculateApplicationProgress(updated);

    res.json({
      message: 'Mobile number verified successfully',
      application: updated,
      progress
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

// 6. Fetch Application Details and 11-Step Progress
router.get('/application/:ref', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { ref } = req.params;
    const application = await prisma.merchantApplication.findUnique({
      where: { referenceNumber: ref },
      include: {
        documents: true,
        bankAccount: true,
        agreementAcceptance: true,
        history: { orderBy: { timestamp: 'desc' } },
        activatedStore: true
      }
    });

    if (!application) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    if (application.userId !== req.user!.userId && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Forbidden: You do not have permission to view this application' });
      return;
    }

    const progress = calculateApplicationProgress(application);

    res.json({ application, progress });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch application' });
  }
});

// 7. Dedicated Progress Route
router.get('/application/:ref/progress', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { ref } = req.params;
    const application = await prisma.merchantApplication.findUnique({
      where: { referenceNumber: ref },
      include: {
        documents: true,
        bankAccount: true,
        agreementAcceptance: true,
        activatedStore: true
      }
    });

    if (!application) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    if (application.userId !== req.user!.userId && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const progress = calculateApplicationProgress(application);
    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate application progress' });
  }
});

// 8. Step Updates (Step 1 to 11)
router.put('/application/:ref/step/:stepNum', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { ref, stepNum } = req.params;
    const step = parseInt(stepNum, 10);

    const application = await prisma.merchantApplication.findUnique({
      where: { referenceNumber: ref },
      include: {
        documents: true,
        bankAccount: true,
        agreementAcceptance: true
      }
    });

    if (!application) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    if (application.userId !== req.user!.userId && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    if (['APPROVED', 'ACTIVE'].includes(application.status)) {
      res.status(400).json({ error: 'Cannot modify an approved application directly' });
      return;
    }

    let updateData: any = {
      currentStep: Math.max(application.currentStep, step)
    };

    // 1. Account / Owner Information (Step 1)
    if (req.body.ownerName || req.body.ownerPhone || req.body.ownerEmail || req.body.businessEntityType) {
      updateData = {
        ...updateData,
        ownerName: req.body.ownerName || application.ownerName,
        ownerPhone: req.body.ownerPhone || application.ownerPhone,
        ownerEmail: req.body.ownerEmail || application.ownerEmail,
        entityType: req.body.businessEntityType || application.entityType
      };
    }

    // 2. Contact Verification (Step 2)
    if (req.body.isPhoneVerified !== undefined) {
      updateData.isPhoneVerified = Boolean(req.body.isPhoneVerified);
    }

    // 3. Business Information (Step 2 or Step 3)
    if (
      req.body.businessName ||
      req.body.legalName ||
      req.body.panNumber ||
      req.body.gstin ||
      req.body.entityType !== undefined ||
      req.body.isGstRegistered !== undefined ||
      req.body.businessRegistrationNumber
    ) {
      updateData = {
        ...updateData,
        businessName: req.body.businessName || application.businessName,
        legalName: req.body.legalName || application.legalName,
        entityType: req.body.entityType || application.entityType,
        panNumber: req.body.panNumber ? req.body.panNumber.toUpperCase() : application.panNumber,
        isGstRegistered: req.body.isGstRegistered !== undefined ? req.body.isGstRegistered : application.isGstRegistered,
        gstin: req.body.gstin ? req.body.gstin.toUpperCase() : application.gstin,
        businessRegistrationNumber: req.body.businessRegistrationNumber || application.businessRegistrationNumber,
        fssaiNumber: req.body.fssaiNumber || application.fssaiNumber
      };
    }

    // 4. Store & Location Details (Step 3 or Step 7)
    if (
      req.body.storeName ||
      req.body.category ||
      req.body.addressLine ||
      req.body.pincode ||
      req.body.latitude !== undefined ||
      req.body.longitude !== undefined ||
      req.body.openingTime ||
      req.body.closingTime ||
      req.body.weeklyClosingDay ||
      req.body.description ||
      req.body.storeLogoUrl ||
      req.body.storeCoverPhoto ||
      req.body.storePhotos
    ) {
      const commissionRatePct = req.body.category ? (CATEGORY_COMMISSION_RATES[req.body.category] || 3.5) : application.commissionRatePct;
      updateData = {
        ...updateData,
        storeName: req.body.storeName || application.storeName,
        category: req.body.category || application.category,
        commissionRatePct,
        description: req.body.description || application.description,
        addressLine: req.body.addressLine || application.addressLine,
        city: req.body.city || application.city || 'Indore',
        district: req.body.district || application.district || 'Indore',
        state: req.body.state || application.state || 'Madhya Pradesh',
        pincode: req.body.pincode || application.pincode,
        latitude: req.body.latitude !== undefined ? parseFloat(req.body.latitude) : application.latitude,
        longitude: req.body.longitude !== undefined ? parseFloat(req.body.longitude) : application.longitude,
        openingTime: req.body.openingTime || application.openingTime,
        closingTime: req.body.closingTime || application.closingTime,
        weeklyClosingDay: req.body.weeklyClosingDay || application.weeklyClosingDay,
        storeLogoUrl: req.body.storeLogoUrl || application.storeLogoUrl,
        storeCoverPhoto: req.body.storeCoverPhoto || application.storeCoverPhoto,
        storePhotos: req.body.storePhotos || application.storePhotos
      };
    }

    // 5. Fulfilment & Licences (Step 4)
    if (
      req.body.hasPickup !== undefined ||
      req.body.hasMerchantDelivery !== undefined ||
      req.body.hasPlatformDelivery !== undefined ||
      req.body.deliveryRadiusKm !== undefined ||
      req.body.minOrderValuePaise !== undefined ||
      req.body.estimatedPrepMinutes !== undefined ||
      req.body.deliveryOperatingHours ||
      req.body.drugLicenseNumber
    ) {
      updateData = {
        ...updateData,
        hasPickup: req.body.hasPickup !== undefined ? Boolean(req.body.hasPickup) : application.hasPickup,
        hasMerchantDelivery: req.body.hasMerchantDelivery !== undefined ? Boolean(req.body.hasMerchantDelivery) : application.hasMerchantDelivery,
        hasPlatformDelivery: req.body.hasPlatformDelivery !== undefined ? Boolean(req.body.hasPlatformDelivery) : application.hasPlatformDelivery,
        deliveryRadiusKm: req.body.deliveryRadiusKm ? parseFloat(req.body.deliveryRadiusKm) : application.deliveryRadiusKm,
        minOrderValuePaise: req.body.minOrderValuePaise ? parseInt(req.body.minOrderValuePaise, 10) : application.minOrderValuePaise,
        estimatedPrepMinutes: req.body.estimatedPrepMinutes ? parseInt(req.body.estimatedPrepMinutes, 10) : application.estimatedPrepMinutes,
        deliveryOperatingHours: req.body.deliveryOperatingHours || application.deliveryOperatingHours,
        drugLicenseNumber: req.body.drugLicenseNumber || application.drugLicenseNumber
      };
    }

    // 6. Bank Details (Step 5 or Step 6)
    if (req.body.accountNumber && req.body.ifsc) {
      const {
        accountHolderName,
        accountNumber,
        confirmAccountNumber,
        ifsc,
        bankName,
        branchName,
        accountType,
        ownershipDeclaration,
        chequeDocumentUrl
      } = req.body;

      if (confirmAccountNumber && confirmAccountNumber !== accountNumber) {
        res.status(400).json({ error: 'Account number and confirmation account number do not match' });
        return;
      }

      const ifscResult = BankVerificationService.lookupIfsc(ifsc);
      const resolvedBankName = bankName || (ifscResult.isValid ? ifscResult.bankName : 'Bank');
      const resolvedBranch = branchName || (ifscResult.isValid ? ifscResult.branchName : 'Main Branch');
      const masked = BankVerificationService.maskAccountNumber(accountNumber);
      const encryptedAcc = BankVerificationService.encryptAccountNumber(accountNumber);

      const auditEvent = {
        timestamp: new Date().toISOString(),
        action: 'BANK_DETAILS_UPDATED',
        actorId: req.user!.userId,
        bankName: resolvedBankName,
        ifsc: ifsc.toUpperCase()
      };

      await prisma.merchantBankAccount.upsert({
        where: { applicationId: application.id },
        create: {
          applicationId: application.id,
          accountHolderName: accountHolderName || application.legalName || application.ownerName,
          bankName: resolvedBankName,
          branchName: resolvedBranch,
          accountType: accountType || 'CURRENT',
          accountNumber: encryptedAcc,
          accountNumberMasked: masked,
          ifsc: ifsc.toUpperCase(),
          ownershipDeclaration: ownershipDeclaration !== undefined ? Boolean(ownershipDeclaration) : true,
          chequeDocumentUrl: chequeDocumentUrl || null,
          verificationStatus: 'PENDING',
          pennyDropStatus: 'NOT_INITIATED',
          auditTrail: JSON.stringify([auditEvent])
        },
        update: {
          accountHolderName: accountHolderName || application.legalName || application.ownerName,
          bankName: resolvedBankName,
          branchName: resolvedBranch,
          accountType: accountType || 'CURRENT',
          accountNumber: encryptedAcc,
          accountNumberMasked: masked,
          ifsc: ifsc.toUpperCase(),
          ownershipDeclaration: ownershipDeclaration !== undefined ? Boolean(ownershipDeclaration) : true,
          chequeDocumentUrl: chequeDocumentUrl || undefined,
          verificationStatus: 'PENDING',
          pennyDropStatus: 'NOT_INITIATED',
          auditTrail: JSON.stringify([auditEvent])
        }
      });
    }

    // 7. Product Catalogue (Step 8)
    if (req.body.products || req.body.productsCatalogueJson) {
      const { productsCatalogueJson, initialProductsCount, products } = req.body;
      let catalogueJson = productsCatalogueJson;
      let count = initialProductsCount;

      if (products && Array.isArray(products)) {
        catalogueJson = JSON.stringify(products);
        count = products.length;
      }

      updateData = {
        ...updateData,
        productsCatalogueJson: catalogueJson || application.productsCatalogueJson,
        initialProductsCount: count !== undefined ? parseInt(count, 10) : application.initialProductsCount
      };
    }

    // 8. Commercial Agreement (Step 7 or Step 9)
    if (req.body.termsAccepted !== undefined || req.body.agreementVersion) {
      const { agreementVersion, termsAccepted } = req.body;
      if (termsAccepted) {
        await prisma.merchantAgreementAcceptance.upsert({
          where: { applicationId: application.id },
          create: {
            applicationId: application.id,
            agreementVersion: agreementVersion || 'v2026.1',
            merchantName: application.ownerName,
            merchantEmail: application.ownerEmail,
            ipAddress: req.ip || req.socket.remoteAddress,
            userAgent: req.headers['user-agent'] || 'Unknown'
          },
          update: {
            agreementVersion: agreementVersion || 'v2026.1',
            merchantName: application.ownerName,
            merchantEmail: application.ownerEmail,
            ipAddress: req.ip || req.socket.remoteAddress,
            userAgent: req.headers['user-agent'] || 'Unknown',
            acceptedAt: new Date()
          }
        });
      }
    }

    const updated = await prisma.merchantApplication.update({
      where: { id: application.id },
      data: updateData,
      include: {
        documents: true,
        bankAccount: true,
        agreementAcceptance: true
      }
    });

    const progress = calculateApplicationProgress(updated);

    // Persist computed completion percentage
    await prisma.merchantApplication.update({
      where: { id: application.id },
      data: { completionPct: progress.completionPct }
    });

    res.json({
      message: `Step ${step} saved successfully`,
      application: updated,
      progress
    });
  } catch (error) {
    console.error('Update step error:', error);
    res.status(500).json({ error: 'Failed to save application step' });
  }
});

// 9. Dedicated Bank Details Endpoint
router.put('/application/:ref/bank-details', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { ref } = req.params;
    const {
      accountHolderName,
      accountNumber,
      confirmAccountNumber,
      ifsc,
      bankName,
      branchName,
      accountType,
      ownershipDeclaration,
      chequeDocumentUrl
    } = req.body;

    const application = await prisma.merchantApplication.findUnique({
      where: { referenceNumber: ref }
    });

    if (!application) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    if (application.userId !== req.user!.userId && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    if (!accountNumber || !ifsc) {
      res.status(400).json({ error: 'Account number and IFSC are mandatory' });
      return;
    }

    if (confirmAccountNumber && confirmAccountNumber !== accountNumber) {
      res.status(400).json({ error: 'Account numbers do not match' });
      return;
    }

    const ifscResult = BankVerificationService.lookupIfsc(ifsc);
    if (!ifscResult.isValid) {
      res.status(400).json({ error: ifscResult.error || 'Invalid IFSC code' });
      return;
    }

    const resolvedBankName = bankName || ifscResult.bankName;
    const resolvedBranch = branchName || ifscResult.branchName;
    const masked = BankVerificationService.maskAccountNumber(accountNumber);
    const encryptedAcc = BankVerificationService.encryptAccountNumber(accountNumber);

    const bankAccount = await prisma.merchantBankAccount.upsert({
      where: { applicationId: application.id },
      create: {
        applicationId: application.id,
        accountHolderName: accountHolderName || application.legalName || application.ownerName,
        bankName: resolvedBankName,
        branchName: resolvedBranch,
        accountType: accountType || 'CURRENT',
        accountNumber: encryptedAcc,
        accountNumberMasked: masked,
        ifsc: ifsc.toUpperCase(),
        ownershipDeclaration: ownershipDeclaration !== undefined ? Boolean(ownershipDeclaration) : true,
        chequeDocumentUrl: chequeDocumentUrl || null,
        verificationStatus: 'PENDING',
        pennyDropStatus: 'NOT_INITIATED'
      },
      update: {
        accountHolderName: accountHolderName || application.legalName || application.ownerName,
        bankName: resolvedBankName,
        branchName: resolvedBranch,
        accountType: accountType || 'CURRENT',
        accountNumber: encryptedAcc,
        accountNumberMasked: masked,
        ifsc: ifsc.toUpperCase(),
        ownershipDeclaration: ownershipDeclaration !== undefined ? Boolean(ownershipDeclaration) : true,
        chequeDocumentUrl: chequeDocumentUrl || undefined,
        verificationStatus: 'PENDING',
        pennyDropStatus: 'NOT_INITIATED'
      }
    });

    const refreshed = await prisma.merchantApplication.findUnique({
      where: { id: application.id },
      include: { documents: true, bankAccount: true, agreementAcceptance: true }
    });

    const progress = calculateApplicationProgress(refreshed);

    res.json({
      message: 'Bank account details saved securely',
      bankAccount,
      progress
    });
  } catch (error) {
    console.error('Save bank details error:', error);
    res.status(500).json({ error: 'Failed to save bank account details' });
  }
});

// 10. Automated Penny-Drop Verification Trigger
router.post('/application/:ref/bank/verify', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { ref } = req.params;

    const application = await prisma.merchantApplication.findUnique({
      where: { referenceNumber: ref },
      include: { bankAccount: true }
    });

    if (!application) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    if (application.userId !== req.user!.userId && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    if (!application.bankAccount) {
      res.status(400).json({ error: 'No bank account details registered to verify' });
      return;
    }

    const bank = application.bankAccount;

    // Decrypt account number for penny drop verification
    let rawAccountNumber = '';
    try {
      rawAccountNumber = BankVerificationService.decryptAccountNumber(bank.accountNumber);
    } catch {
      rawAccountNumber = bank.accountNumber; // fallback if unencrypted in test
    }

    const verificationResult = await BankVerificationService.verifyPennyDrop(
      rawAccountNumber,
      bank.ifsc,
      bank.accountHolderName,
      application.legalName || application.businessName || application.ownerName
    );

    const verificationStatus =
      verificationResult.status === 'SUCCESS'
        ? 'VERIFIED'
        : verificationResult.status === 'MANUAL_REVIEW'
        ? 'MANUAL_REVIEW'
        : 'REJECTED';

    const updatedBank = await prisma.merchantBankAccount.update({
      where: { id: bank.id },
      data: {
        pennyDropStatus: verificationResult.status,
        pennyDropRef: verificationResult.providerRef,
        pennyDropBeneficiaryName: verificationResult.beneficiaryName,
        pennyDropMatchScore: verificationResult.matchScore,
        verificationStatus,
        verificationMethod: 'AUTOMATED_PENNY_DROP',
        rejectionReason: verificationResult.status === 'FAILED' ? verificationResult.remarks : null,
        verifiedAt: verificationResult.status === 'SUCCESS' ? new Date() : null,
        lastReverificationTriggeredAt: new Date()
      }
    });

    const refreshed = await prisma.merchantApplication.findUnique({
      where: { id: application.id },
      include: { documents: true, bankAccount: true, agreementAcceptance: true }
    });

    const progress = calculateApplicationProgress(refreshed);

    res.json({
      message:
        verificationResult.status === 'SUCCESS'
          ? 'Bank account verified successfully via Penny-Drop (₹1 deposit).'
          : verificationResult.status === 'MANUAL_REVIEW'
          ? 'Penny-Drop deposited. Minor name variation routed for manual admin review.'
          : 'Penny-Drop verification failed. Please check account number and IFSC.',
      verification: verificationResult,
      bankAccount: updatedBank,
      progress
    });
  } catch (error) {
    console.error('Penny drop verification error:', error);
    res.status(500).json({ error: 'Penny-drop verification encountered an unexpected error' });
  }
});

// 11. Dedicated Product Catalogue Draft Endpoint
router.post('/application/:ref/catalogue', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { ref } = req.params;
    const { products } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      res.status(400).json({ error: 'A list of at least one product is required for catalogue setup' });
      return;
    }

    const application = await prisma.merchantApplication.findUnique({
      where: { referenceNumber: ref }
    });

    if (!application) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    if (application.userId !== req.user!.userId && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const updated = await prisma.merchantApplication.update({
      where: { id: application.id },
      data: {
        productsCatalogueJson: JSON.stringify(products),
        initialProductsCount: products.length,
        currentStep: Math.max(application.currentStep, 8)
      },
      include: {
        documents: true,
        bankAccount: true,
        agreementAcceptance: true
      }
    });

    const progress = calculateApplicationProgress(updated);

    res.json({
      message: `Product catalogue updated with ${products.length} draft items`,
      productsCount: products.length,
      progress
    });
  } catch (error) {
    console.error('Catalogue update error:', error);
    res.status(500).json({ error: 'Failed to update draft product catalogue' });
  }
});

// 12. Upload Statutory & Verification Documents
router.post(
  '/application/:ref/documents',
  authenticateToken,
  upload.single('file'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { ref } = req.params;
      const { documentType } = req.body;

      if (!req.file) {
        res.status(400).json({ error: 'No document file uploaded' });
        return;
      }

      const application = await prisma.merchantApplication.findUnique({
        where: { referenceNumber: ref }
      });

      if (!application) {
        res.status(404).json({ error: 'Application not found' });
        return;
      }

      if (application.userId !== req.user!.userId && req.user!.role !== 'ADMIN') {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      // Validate Magic Bytes
      const buffer = req.file.buffer;
      const isPdf = buffer.length > 4 && buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46; // %PDF
      const detectedImg = detectImageMagicBytes(buffer);

      if (!isPdf && !detectedImg) {
        res.status(400).json({
          error: 'Invalid file format. Only authentic PDF, JPEG, PNG, and WebP files are permitted.'
        });
        return;
      }

      const ext = isPdf ? '.pdf' : (detectedImg === 'image/png' ? '.png' : (detectedImg === 'image/webp' ? '.webp' : '.jpg'));
      const safeDocName = `doc-${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
      const filePath = path.join(SECURE_DOCS_DIR, safeDocName);

      fs.writeFileSync(filePath, buffer);

      const fileUrl = `/api/onboarding/application/${ref}/documents/file/${safeDocName}`;

      const document = await prisma.merchantDocument.create({
        data: {
          applicationId: application.id,
          documentType: documentType || 'BUSINESS_REGISTRATION',
          fileName: req.file.originalname,
          fileUrl,
          fileSizeBytes: buffer.length,
          mimeType: isPdf ? 'application/pdf' : detectedImg!,
          isProtected: true,
          verificationStatus: 'PENDING'
        }
      });

      const refreshed = await prisma.merchantApplication.findUnique({
        where: { id: application.id },
        include: { documents: true, bankAccount: true, agreementAcceptance: true }
      });

      const progress = calculateApplicationProgress(refreshed);

      res.status(201).json({
        message: 'Document uploaded securely',
        document,
        progress
      });
    } catch (error) {
      console.error('Document upload error:', error);
      res.status(500).json({ error: 'Failed to upload document' });
    }
  }
);

// 13. Secure Protected Document Download/Preview
router.get(
  '/application/:ref/documents/file/:filename',
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { ref, filename } = req.params;

      const application = await prisma.merchantApplication.findUnique({
        where: { referenceNumber: ref }
      });

      if (!application) {
        res.status(404).json({ error: 'Application not found' });
        return;
      }

      if (application.userId !== req.user!.userId && req.user!.role !== 'ADMIN') {
        res.status(403).json({ error: 'Access denied: You do not have permission to view this document' });
        return;
      }

      const safeFilename = path.basename(filename);
      const filePath = path.join(SECURE_DOCS_DIR, safeFilename);

      if (!fs.existsSync(filePath)) {
        res.status(404).json({ error: 'Document not found' });
        return;
      }

      res.sendFile(filePath);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve document' });
    }
  }
);

// 14. Submit Application for Review (Step 10 Transition)
router.post('/application/:ref/submit', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { ref } = req.params;

    const application = await prisma.merchantApplication.findUnique({
      where: { referenceNumber: ref },
      include: {
        documents: true,
        bankAccount: true,
        agreementAcceptance: true
      }
    });

    if (!application) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    if (application.userId !== req.user!.userId && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    // Category-specific statutory checks
    if (application.category === 'Pharmacy & Wellness' && !application.drugLicenseNumber) {
      res.status(400).json({
        error: 'Drug License number is mandatory for Pharmacy & Wellness category',
        missingFields: ['Drug License number is mandatory for Pharmacy & Wellness category']
      });
      return;
    }

    // Auto-populate default Indore starter catalogue if not already added
    if (!application.productsCatalogueJson || application.initialProductsCount === 0) {
      const defaultCatalogue = [
        { name: 'Refined White Sugar', category: application.category || 'Grocery & Daily Staples', pricePaise: 4800, mrpPaise: 5500, stock: 50 },
        { name: 'Chakki Fresh Atta', category: application.category || 'Grocery & Daily Staples', pricePaise: 34000, mrpPaise: 38000, stock: 40 },
        { name: 'Premium Basmati Rice', category: application.category || 'Grocery & Daily Staples', pricePaise: 16500, mrpPaise: 19000, stock: 35 },
        { name: 'Unpolished Toor Dal', category: application.category || 'Grocery & Daily Staples', pricePaise: 14500, mrpPaise: 16000, stock: 30 }
      ];
      await prisma.merchantApplication.update({
        where: { id: application.id },
        data: {
          productsCatalogueJson: JSON.stringify(defaultCatalogue),
          initialProductsCount: defaultCatalogue.length
        }
      });
      application.productsCatalogueJson = JSON.stringify(defaultCatalogue);
      application.initialProductsCount = defaultCatalogue.length;
    }

    const progress = calculateApplicationProgress(application);

    // Validation Requirements for Submission
    if (progress.missingFields.length > 0) {
      console.log('SUBMIT BLOCKED DUE TO MISSING FIELDS:', progress.missingFields);
      res.status(400).json({
        error: 'Cannot submit incomplete application. Please complete all required steps.',
        missingFields: progress.missingFields
      });
      return;
    }

    if (progress.hasRejectedDocuments) {
      res.status(400).json({
        error: 'Please re-upload rejected KYC documents before submitting.',
        rejectedDocuments: progress.rejectedDocuments
      });
      return;
    }

    const previousStatus = application.status;
    const newStatus = 'SUBMITTED';

    const updated = await prisma.merchantApplication.update({
      where: { id: application.id },
      data: {
        status: newStatus,
        currentStep: 10,
        adminFeedback: null
      },
      include: {
        documents: true,
        bankAccount: true,
        agreementAcceptance: true,
        history: true
      }
    });

    await prisma.merchantOnboardingHistory.create({
      data: {
        applicationId: application.id,
        fromStatus: previousStatus,
        toStatus: newStatus,
        actorRole: 'MERCHANT',
        actorId: req.user!.userId,
        notes: 'Merchant completed onboarding steps and submitted application for verification'
      }
    });

    const updatedProgress = calculateApplicationProgress(updated);

    res.json({
      message: 'Application submitted successfully for verification',
      referenceNumber: updated.referenceNumber,
      status: updated.status,
      application: updated,
      progress: updatedProgress
    });
  } catch (error) {
    console.error('Submit application error:', error);
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

// 15. Withdraw Application
router.post('/application/:ref/withdraw', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { ref } = req.params;
    const application = await prisma.merchantApplication.findUnique({
      where: { referenceNumber: ref }
    });

    if (!application) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    if (application.userId !== req.user!.userId && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const updated = await prisma.merchantApplication.update({
      where: { id: application.id },
      data: { status: 'WITHDRAWN' }
    });

    await prisma.merchantOnboardingHistory.create({
      data: {
        applicationId: application.id,
        fromStatus: application.status,
        toStatus: 'WITHDRAWN',
        actorRole: 'MERCHANT',
        actorId: req.user!.userId,
        notes: 'Merchant voluntarily withdrew application'
      }
    });

    res.json({ message: 'Application withdrawn', application: updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to withdraw application' });
  }
});

export default router;
