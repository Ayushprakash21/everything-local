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

// 2. Step 1: Start or Resume Onboarding Application
const StartOnboardingSchema = z.object({
  ownerName: z.string().min(2, 'Owner name must be at least 2 characters'),
  ownerPhone: z.string().min(10, 'Valid 10-digit mobile number required'),
  ownerEmail: z.string().email('Valid email address required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  communicationConsent: z.boolean().default(true)
});

router.post('/start', async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = StartOnboardingSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: 'Validation failed', details: parse.error.errors });
      return;
    }

    const { ownerName, ownerPhone, ownerEmail, password, communicationConsent } = parse.data;

    // Check if user already exists
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ email: ownerEmail }, { phone: ownerPhone }]
      }
    });

    let token = '';

    if (!user) {
      // Create user with CUSTOMER role initially (Role elevated to MERCHANT on application approval)
      const passwordHash = await bcrypt.hash(password, 10);
      user = await prisma.user.create({
        data: {
          name: ownerName,
          email: ownerEmail,
          phone: ownerPhone,
          passwordHash,
          role: 'CUSTOMER'
        }
      });
    }

    token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role as any
    });

    // Check if user has an existing active or draft application
    let application = await prisma.merchantApplication.findFirst({
      where: {
        userId: user.id,
        status: { notIn: ['REJECTED', 'WITHDRAWN'] }
      },
      include: {
        documents: true,
        bankAccount: true,
        agreementAcceptance: true
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
          communicationConsent,
          isPhoneVerified: false,
          isEmailVerified: false,
          status: 'DRAFT',
          currentStep: 1
        },
        include: {
          documents: true,
          bankAccount: true,
          agreementAcceptance: true
        }
      });

      await prisma.merchantOnboardingHistory.create({
        data: {
          applicationId: application.id,
          fromStatus: 'INITIAL',
          toStatus: 'DRAFT',
          actorRole: 'MERCHANT',
          actorId: user.id,
          notes: 'Application draft initialized'
        }
      });
    }

    res.status(201).json({
      message: 'Onboarding application initiated successfully',
      token,
      application
    });
  } catch (error) {
    console.error('Start onboarding error:', error);
    res.status(500).json({ error: 'Internal server error starting onboarding' });
  }
});

// 3. Verify Phone OTP (Deterministic verification in pilot/test)
router.post('/verify-phone-otp', async (req: Request, res: Response): Promise<void> => {
  try {
    const { referenceNumber, otp } = req.body;
    if (!referenceNumber || !otp) {
      res.status(400).json({ error: 'Reference number and OTP are required' });
      return;
    }

    const application = await prisma.merchantApplication.findUnique({
      where: { referenceNumber }
    });

    if (!application) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    // Verify OTP (In staging/test, 1234 or 0000 accepted; or any 4-6 digit string)
    if (otp !== '1234' && otp.length < 4) {
      res.status(400).json({ error: 'Invalid verification code' });
      return;
    }

    const updated = await prisma.merchantApplication.update({
      where: { id: application.id },
      data: { isPhoneVerified: true }
    });

    res.json({ message: 'Mobile number verified successfully', application: updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

// 4. Fetch Application Progress by Reference
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

    // Guard: Only applicant or ADMIN can view application
    if (application.userId !== req.user!.userId && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Forbidden: You do not have permission to view this application' });
      return;
    }

    res.json({ application });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch application' });
  }
});

// 5. Update Wizard Step Data
router.put('/application/:ref/step/:stepNum', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { ref, stepNum } = req.params;
    const step = parseInt(stepNum, 10);

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

    // Prevent editing approved or active applications
    if (['APPROVED', 'ACTIVE'].includes(application.status)) {
      res.status(400).json({ error: 'Cannot modify an approved application directly' });
      return;
    }

    let updateData: any = {
      currentStep: Math.max(application.currentStep, step)
    };

    if (step === 2) {
      // Step 2: Business Information
      const {
        businessName,
        legalName,
        entityType,
        panNumber,
        isGstRegistered,
        gstin,
        businessRegistrationNumber
      } = req.body;

      updateData = {
        ...updateData,
        businessName: businessName || application.businessName,
        legalName: legalName || application.legalName,
        entityType: entityType || application.entityType,
        panNumber: panNumber ? panNumber.toUpperCase() : application.panNumber,
        isGstRegistered: isGstRegistered !== undefined ? isGstRegistered : application.isGstRegistered,
        gstin: gstin ? gstin.toUpperCase() : application.gstin,
        businessRegistrationNumber: businessRegistrationNumber || application.businessRegistrationNumber
      };
    } else if (step === 3) {
      // Step 3: Store Information
      const {
        storeName,
        category,
        description,
        addressLine,
        city,
        district,
        state,
        pincode,
        latitude,
        longitude,
        openingTime,
        closingTime,
        weeklyClosingDay,
        storePhotos
      } = req.body;

      // Automatically determine category commission
      const commissionRatePct = CATEGORY_COMMISSION_RATES[category] || 3.5;

      updateData = {
        ...updateData,
        storeName: storeName || application.storeName,
        category: category || application.category,
        commissionRatePct,
        description: description || application.description,
        addressLine: addressLine || application.addressLine,
        city: city || 'Indore',
        district: district || 'Indore',
        state: state || 'Madhya Pradesh',
        pincode: pincode || application.pincode,
        latitude: latitude !== undefined ? parseFloat(latitude) : application.latitude,
        longitude: longitude !== undefined ? parseFloat(longitude) : application.longitude,
        openingTime: openingTime || application.openingTime,
        closingTime: closingTime || application.closingTime,
        weeklyClosingDay: weeklyClosingDay || application.weeklyClosingDay,
        storePhotos: storePhotos || application.storePhotos
      };
    } else if (step === 4) {
      // Step 4: Delivery Configuration & Licences
      const {
        hasPickup,
        hasMerchantDelivery,
        hasPlatformDelivery,
        deliveryRadiusKm,
        minOrderValuePaise,
        estimatedPrepMinutes,
        deliveryOperatingHours,
        fssaiNumber,
        drugLicenseNumber
      } = req.body;

      updateData = {
        ...updateData,
        hasPickup: hasPickup !== undefined ? Boolean(hasPickup) : application.hasPickup,
        hasMerchantDelivery: hasMerchantDelivery !== undefined ? Boolean(hasMerchantDelivery) : application.hasMerchantDelivery,
        hasPlatformDelivery: hasPlatformDelivery !== undefined ? Boolean(hasPlatformDelivery) : application.hasPlatformDelivery,
        deliveryRadiusKm: deliveryRadiusKm ? parseFloat(deliveryRadiusKm) : application.deliveryRadiusKm,
        minOrderValuePaise: minOrderValuePaise ? parseInt(minOrderValuePaise, 10) : application.minOrderValuePaise,
        estimatedPrepMinutes: estimatedPrepMinutes ? parseInt(estimatedPrepMinutes, 10) : application.estimatedPrepMinutes,
        deliveryOperatingHours: deliveryOperatingHours || application.deliveryOperatingHours,
        fssaiNumber: fssaiNumber || application.fssaiNumber,
        drugLicenseNumber: drugLicenseNumber || application.drugLicenseNumber
      };
    } else if (step === 6) {
      // Step 6: Bank Account Details
      const { accountHolderName, bankName, accountNumber, ifsc, chequeDocumentUrl } = req.body;
      if (accountNumber && ifsc) {
        const last4 = accountNumber.slice(-4);
        const masked = `•••• •••• ${last4}`;

        await prisma.merchantBankAccount.upsert({
          where: { applicationId: application.id },
          create: {
            applicationId: application.id,
            accountHolderName: accountHolderName || application.ownerName,
            bankName: bankName || 'Bank',
            accountNumber,
            accountNumberMasked: masked,
            ifsc: ifsc.toUpperCase(),
            chequeDocumentUrl,
            verificationStatus: 'PENDING'
          },
          update: {
            accountHolderName: accountHolderName || application.ownerName,
            bankName: bankName || 'Bank',
            accountNumber,
            accountNumberMasked: masked,
            ifsc: ifsc.toUpperCase(),
            chequeDocumentUrl,
            verificationStatus: 'PENDING'
          }
        });
      }
    } else if (step === 7) {
      // Step 7: Commercial Agreement Acceptance
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

    res.json({ message: `Step ${step} saved successfully`, application: updated });
  } catch (error) {
    console.error('Update step error:', error);
    res.status(500).json({ error: 'Failed to save application step' });
  }
});

// 6. Upload Statutory & Verification Documents
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

      res.status(201).json({
        message: 'Document uploaded securely',
        document
      });
    } catch (error) {
      console.error('Document upload error:', error);
      res.status(500).json({ error: 'Failed to upload document' });
    }
  }
);

// 7. Secure Protected Document Download/Preview
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

      // Restrict access to application owner or ADMIN
      if (application.userId !== req.user!.userId && req.user!.role !== 'ADMIN') {
        res.status(403).json({ error: 'Access denied: You do not have permission to view this document' });
        return;
      }

      // Prevent directory traversal
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

// 8. Submit Application for Review
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

    // Validation Requirements for Submission
    const errors: string[] = [];
    if (!application.businessName) errors.push('Business Name is required');
    if (!application.storeName) errors.push('Store Name is required');
    if (!application.addressLine || !application.pincode) errors.push('Complete store address and PIN code are required');
    if (!application.bankAccount) errors.push('Bank account details are required');
    if (!application.agreementAcceptance) errors.push('Commercial agreement must be accepted');

    // Category-specific statutory checks
    if (application.category === 'Pharmacy & Wellness' && !application.drugLicenseNumber) {
      errors.push('Drug License number is mandatory for Pharmacy & Wellness category');
    }

    if (errors.length > 0) {
      res.status(400).json({ error: 'Cannot submit incomplete application', missingFields: errors });
      return;
    }

    const previousStatus = application.status;
    const newStatus = 'SUBMITTED';

    const updated = await prisma.merchantApplication.update({
      where: { id: application.id },
      data: {
        status: newStatus,
        adminFeedback: null // Clear previous correction feedback
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
        notes: 'Merchant submitted application for partner verification'
      }
    });

    res.json({
      message: 'Application submitted successfully for verification',
      referenceNumber: updated.referenceNumber,
      status: updated.status,
      application: updated
    });
  } catch (error) {
    console.error('Submit application error:', error);
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

// 9. Withdraw Application
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
