import { Router, Request, Response } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from '../db';
import { authenticateToken, requireRole } from '../middleware/auth';
import { GeospatialEngine } from '../core/geospatial';

const router = Router();

// Private, Non-Public Secure Prescription Storage Directory
const SECURE_PRESCRIPTION_DIR = path.resolve(__dirname, '../../secure_storage/prescriptions');
if (!fs.existsSync(SECURE_PRESCRIPTION_DIR)) {
  fs.mkdirSync(SECURE_PRESCRIPTION_DIR, { recursive: true });
}

// Multer storage for secure prescription uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, SECURE_PRESCRIPTION_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanExt = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'].includes(ext) ? ext : '.bin';
    const unique = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${cleanExt}`;
    cb(null, `rx_${unique}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB per document
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('INVALID_FILE_TYPE: Only JPG, PNG, WEBP, and PDF documents are permitted.'));
    }
  }
});

/**
 * Validate file content using magic bytes inspection (do not trust extensions alone)
 */
function validateFileMagicBytes(filePath: string): boolean {
  try {
    const buffer = Buffer.alloc(16);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 16, 0);
    fs.closeSync(fd);

    // JPEG: FF D8 FF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return true;
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    ) {
      return true;
    }
    // PDF: %PDF (25 50 44 46)
    if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) return true;
    // WEBP: 'RIFF' .... 'WEBP'
    if (
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46 &&
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50
    ) {
      return true;
    }

    return false;
  } catch (err) {
    return false;
  }
}

// ====================================================
// 1. PUBLIC / CUSTOMER PHARMACY DISCOVERY & MEDICINES
// ====================================================

// List nearby verified licensed pharmacies
router.get('/stores', async (req: Request, res: Response): Promise<void> => {
  try {
    const { lat, lng } = req.query;
    const userLat = parseFloat(lat as string) || GeospatialEngine.INDORE_LANDMARKS.PALASIA.latitude;
    const userLng = parseFloat(lng as string) || GeospatialEngine.INDORE_LANDMARKS.PALASIA.longitude;

    const pharmacies = await prisma.pharmacy.findMany({
      where: {
        isVerified: true
      },
      include: {
        licences: true,
        pharmacists: { where: { isActive: true } }
      }
    });

    const storesWithDistance = pharmacies.map((pharmacy) => {
      const distanceKm = GeospatialEngine.calculateDistanceKm(
        { latitude: userLat, longitude: userLng },
        { latitude: pharmacy.latitude, longitude: pharmacy.longitude }
      );
      const isServiceable = distanceKm <= pharmacy.serviceRadiusKm;

      return {
        ...pharmacy,
        distanceKm,
        isServiceable,
        activePharmacist: pharmacy.pharmacists[0] || null,
        activeLicences: pharmacy.licences.filter((l) => l.status === 'VERIFIED')
      };
    });

    storesWithDistance.sort((a, b) => a.distanceKm - b.distanceKm);

    res.json({ pharmacies: storesWithDistance });
  } catch (error) {
    console.error('Error fetching pharmacies:', error);
    res.status(500).json({ error: 'Failed to fetch pharmacies' });
  }
});

// Get Pharmacy Details
router.get('/stores/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const pharmacy = await prisma.pharmacy.findUnique({
      where: { id },
      include: {
        licences: true,
        pharmacists: { where: { isActive: true } },
        inventory: {
          include: { medicine: true },
          take: 30
        }
      }
    });

    if (!pharmacy) {
      res.status(404).json({ error: 'Pharmacy not found' });
      return;
    }

    res.json({ pharmacy });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pharmacy details' });
  }
});

// Search Medicine Catalogue
router.get('/medicines', async (req: Request, res: Response): Promise<void> => {
  try {
    const { q, classification, category } = req.query;

    const where: any = {};

    if (q && typeof q === 'string') {
      where.OR = [
        { name: { contains: q } },
        { brand: { contains: q } },
        { genericName: { contains: q } }
      ];
    }

    if (classification && typeof classification === 'string') {
      where.classification = classification;
    }

    const medicines = await prisma.medicine.findMany({
      where,
      orderBy: { name: 'asc' },
      take: 50
    });

    res.json({ medicines });
  } catch (error) {
    res.status(500).json({ error: 'Failed to search medicines' });
  }
});

// Get Medicine Details
router.get('/medicines/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const medicine = await prisma.medicine.findUnique({
      where: { id }
    });

    if (!medicine) {
      res.status(404).json({ error: 'Medicine not found' });
      return;
    }

    res.json({ medicine });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch medicine details' });
  }
});

// ====================================================
// 2. SECURE PRESCRIPTION UPLOAD & WORKFLOW
// ====================================================

// Step 1: Upload prescription file (Multipart document upload)
router.post(
  '/prescriptions/upload',
  authenticateToken,
  (req, res, next) => {
    upload.array('documents', 5)(req, res, (err: any) => {
      if (err) {
        if (err.message && err.message.includes('INVALID_FILE_TYPE')) {
          res.status(400).json({ error: err.message });
          return;
        }
        res.status(400).json({ error: err.message || 'File upload failed' });
        return;
      }
      next();
    });
  },
  async (req: Request, res: Response): Promise<void> => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        res.status(400).json({ error: 'No prescription document files provided' });
        return;
      }

      const validatedDocuments: Array<{
        fileName: string;
        fileType: string;
        fileSizeBytes: number;
        storagePath: string;
      }> = [];

      for (const file of files) {
        // Deep content verification using magic bytes
        const isValidMagic = validateFileMagicBytes(file.path);
        if (!isValidMagic) {
          // Remove invalid file immediately
          fs.unlinkSync(file.path);
          res.status(400).json({
            error: `File ${file.originalname} has invalid content. Only authentic JPEG, PNG, WEBP, and PDF documents are permitted.`
          });
          return;
        }

        validatedDocuments.push({
          fileName: file.originalname,
          fileType: file.mimetype,
          fileSizeBytes: file.size,
          storagePath: file.filename // Store private filename only, never public URL
        });
      }

      res.status(201).json({
        message: 'Prescription document(s) uploaded successfully to secure storage',
        documents: validatedDocuments
      });
    } catch (error) {
      console.error('Prescription upload error:', error);
      res.status(500).json({ error: 'Internal error during prescription upload' });
    }
  }
);

// Step 2: Submit Prescription with Patient Details & Delivery Address
const SubmitPrescriptionSchema = z.object({
  pharmacyId: z.string().optional(),
  patientName: z.string().min(2, 'Patient name is required'),
  patientAge: z.number().int().min(0).max(120),
  patientGender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  patientRelation: z.string().default('Self'),
  customerNotes: z.string().optional(),
  deliveryAddress: z.string().min(5, 'Delivery address is required'),
  deliveryType: z.enum(['HOME_DELIVERY', 'COUNTER_PICKUP']).default('HOME_DELIVERY'),
  documents: z.array(
    z.object({
      fileName: z.string(),
      fileType: z.string(),
      fileSizeBytes: z.number(),
      storagePath: z.string()
    })
  ).min(1, 'At least one prescription document page is required')
});

router.post('/prescriptions', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = SubmitPrescriptionSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: 'Validation failed', details: parse.error.errors });
      return;
    }

    const {
      pharmacyId,
      patientName,
      patientAge,
      patientGender,
      patientRelation,
      customerNotes,
      deliveryAddress,
      deliveryType,
      documents
    } = parse.data;

    // Verify assigned pharmacy if provided
    let targetPharmacyId = pharmacyId;
    if (pharmacyId) {
      const pharmacy = await prisma.pharmacy.findUnique({
        where: { id: pharmacyId }
      });
      if (!pharmacy || !pharmacy.isVerified) {
        res.status(400).json({ error: 'Selected pharmacy is not verified or currently unavailable' });
        return;
      }
    } else {
      // Broadcast to nearest verified pharmacy in Indore
      const defaultPharmacy = await prisma.pharmacy.findFirst({
        where: { isVerified: true, isOpen: true }
      });
      targetPharmacyId = defaultPharmacy?.id;
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const prescriptionNumber = `RX-${dateStr}-${randomSuffix}`;

    const prescription = await prisma.prescription.create({
      data: {
        prescriptionNumber,
        customerId: req.user!.userId,
        pharmacyId: targetPharmacyId,
        status: 'SUBMITTED',
        patientName,
        patientAge,
        patientGender,
        patientRelation,
        customerNotes,
        deliveryAddress,
        deliveryType,
        documents: {
          create: documents.map((doc, idx) => ({
            pageNumber: idx + 1,
            fileName: doc.fileName,
            fileType: doc.fileType,
            fileSizeBytes: doc.fileSizeBytes,
            storagePath: doc.storagePath
          }))
        },
        auditEvents: {
          create: {
            actorId: req.user!.userId,
            actorRole: 'CUSTOMER',
            actorName: patientName,
            action: 'CREATED',
            details: `Prescription submitted with ${documents.length} page(s) for patient ${patientName}`
          }
        }
      },
      include: {
        documents: true,
        pharmacy: true
      }
    });

    res.status(201).json({
      message: 'Prescription submitted successfully. A registered pharmacist will review it before eligible medicine is dispensed.',
      prescription
    });
  } catch (error) {
    console.error('Submit prescription error:', error);
    res.status(500).json({ error: 'Failed to submit prescription' });
  }
});

// List Customer Prescriptions
router.get('/prescriptions/my', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const prescriptions = await prisma.prescription.findMany({
      where: { customerId: req.user!.userId },
      include: {
        documents: true,
        pharmacy: true,
        quotations: {
          include: { items: true },
          orderBy: { createdAt: 'desc' }
        },
        order: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ prescriptions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customer prescriptions' });
  }
});

// Get Single Prescription Details (Secure Role & Ownership Guarded)
router.get('/prescriptions/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const prescription = await prisma.prescription.findUnique({
      where: { id },
      include: {
        documents: true,
        pharmacy: {
          include: { pharmacists: true, licences: true }
        },
        reviews: true,
        quotations: {
          include: { items: true }
        },
        order: {
          include: { dispensingRecords: true }
        },
        auditEvents: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!prescription) {
      res.status(404).json({ error: 'Prescription not found' });
      return;
    }

    // Access Control: Customer must own it, or user is pharmacist/admin
    const isOwner = prescription.customerId === req.user!.userId;
    const isAdmin = req.user!.role === 'ADMIN';

    // Check if user is associated pharmacist
    let isAssignedPharmacist = false;
    if (prescription.pharmacyId) {
      const pharmacy = await prisma.pharmacy.findUnique({
        where: { id: prescription.pharmacyId }
      });
      if (pharmacy && pharmacy.ownerId === req.user!.userId) {
        isAssignedPharmacist = true;
      }
    }

    if (!isOwner && !isAdmin && !isAssignedPharmacist) {
      res.status(403).json({ error: 'Forbidden: You do not have permission to view this prescription' });
      return;
    }

    res.json({ prescription });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch prescription details' });
  }
});

// Secure Document Streaming (NO PUBLIC URL - Authenticated Streaming Only)
router.get(
  '/prescriptions/:id/documents/:docId/view',
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id, docId } = req.params;

      const prescription = await prisma.prescription.findUnique({
        where: { id },
        include: { documents: true, pharmacy: true }
      });

      if (!prescription) {
        res.status(404).json({ error: 'Prescription not found' });
        return;
      }

      // Role and Access Check
      const isOwner = prescription.customerId === req.user!.userId;
      const isAdmin = req.user!.role === 'ADMIN';
      const isPharmacist = prescription.pharmacy && prescription.pharmacy.ownerId === req.user!.userId;

      if (!isOwner && !isAdmin && !isPharmacist) {
        res.status(403).json({ error: 'Forbidden: Access to this medical document is strictly restricted' });
        return;
      }

      const doc = prescription.documents.find((d) => d.id === docId);
      if (!doc) {
        res.status(404).json({ error: 'Prescription document not found' });
        return;
      }

      const filePath = path.join(SECURE_PRESCRIPTION_DIR, doc.storagePath);
      if (!fs.existsSync(filePath)) {
        res.status(404).json({ error: 'Prescription file not found on secure storage' });
        return;
      }

      // Log Audit Event
      await prisma.prescriptionAuditEvent.create({
        data: {
          prescriptionId: id,
          actorId: req.user!.userId,
          actorRole: req.user!.role,
          action: 'VIEWED',
          details: `Document ${doc.fileName} viewed by ${req.user!.role} (${req.user!.email})`
        }
      });

      res.setHeader('Content-Type', doc.fileType);
      res.setHeader('Content-Disposition', `inline; filename="${doc.fileName}"`);
      res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');

      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error streaming prescription document:', error);
      res.status(500).json({ error: 'Failed to stream document' });
    }
  }
);

// Customer Cancel Prescription
router.post('/prescriptions/:id/cancel', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const prescription = await prisma.prescription.findUnique({ where: { id } });
    if (!prescription) {
      res.status(404).json({ error: 'Prescription not found' });
      return;
    }

    if (prescription.customerId !== req.user!.userId && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    if (['DISPENSED', 'COMPLETED'].includes(prescription.status)) {
      res.status(400).json({ error: 'Cannot cancel prescription after medicine has already been dispensed' });
      return;
    }

    const updated = await prisma.prescription.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });

    await prisma.prescriptionAuditEvent.create({
      data: {
        prescriptionId: id,
        actorId: req.user!.userId,
        actorRole: req.user!.role,
        action: 'CANCELLED',
        details: reason || 'Prescription cancelled by customer before dispensing'
      }
    });

    res.json({ message: 'Prescription cancelled successfully', prescription: updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel prescription' });
  }
});

// ====================================================
// 3. PHARMACIST REVIEW CONSOLE & QUOTATION APIS
// ====================================================

// Incoming prescription review queue for authorized pharmacists
router.get(
  '/console/prescriptions',
  authenticateToken,
  requireRole('MERCHANT', 'ADMIN'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Find the pharmacy owned by this merchant
      const pharmacy = await prisma.pharmacy.findFirst({
        where: req.user!.role === 'ADMIN' ? {} : { ownerId: req.user!.userId }
      });

      if (!pharmacy && req.user!.role !== 'ADMIN') {
        res.status(403).json({
          error: 'Only authorized pharmacists and registered pharmacy merchants may access prescription console'
        });
        return;
      }

      const prescriptions = await prisma.prescription.findMany({
        where: req.user!.role === 'ADMIN' ? {} : { pharmacyId: pharmacy!.id },
        include: {
          documents: true,
          quotations: { include: { items: true } },
          reviews: true
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json({ prescriptions, pharmacy });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch prescription queue' });
    }
  }
);

// Pharmacist Review Submission (Approve / Reject / Request Info)
const PharmacistReviewSchema = z.object({
  decision: z.enum(['APPROVED', 'PARTIALLY_APPROVED', 'REJECTED', 'INFO_REQUESTED']),
  doctorVerified: z.boolean().default(false),
  validityVerified: z.boolean().default(false),
  notes: z.string().optional(),
  rejectionReason: z.string().optional(),
  pharmacistName: z.string().min(2),
  pharmacistRegNo: z.string().min(4)
});

router.post(
  '/console/prescriptions/:id/review',
  authenticateToken,
  requireRole('MERCHANT', 'ADMIN'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const parse = PharmacistReviewSchema.safeParse(req.body);
      if (!parse.success) {
        res.status(400).json({ error: 'Invalid review parameters', details: parse.error.errors });
        return;
      }

      const prescription = await prisma.prescription.findUnique({
        where: { id },
        include: { pharmacy: true }
      });

      if (!prescription) {
        res.status(404).json({ error: 'Prescription not found' });
        return;
      }

      // Check pharmacy authorisation
      if (req.user!.role !== 'ADMIN') {
        const pharmacy = await prisma.pharmacy.findFirst({
          where: { ownerId: req.user!.userId }
        });
        if (!pharmacy || (prescription.pharmacyId && prescription.pharmacyId !== pharmacy.id)) {
          res.status(403).json({ error: 'You are not authorised to review prescriptions for this pharmacy' });
          return;
        }

        // Check if pharmacy is verified and licence not expired
        if (!pharmacy.isVerified) {
          res.status(403).json({ error: 'Pharmacy licence is pending verification or suspended. Review blocked.' });
          return;
        }
      }

      const {
        decision,
        doctorVerified,
        validityVerified,
        notes,
        rejectionReason,
        pharmacistName,
        pharmacistRegNo
      } = parse.data;

      let nextStatus = 'UNDER_PHARMACIST_REVIEW';
      if (decision === 'APPROVED') nextStatus = 'APPROVED';
      else if (decision === 'PARTIALLY_APPROVED') nextStatus = 'PARTIALLY_APPROVED';
      else if (decision === 'REJECTED') nextStatus = 'REJECTED';
      else if (decision === 'INFO_REQUESTED') nextStatus = 'ADDITIONAL_INFO_REQUIRED';

      // Create Review Record
      const review = await prisma.prescriptionReview.create({
        data: {
          prescriptionId: id,
          pharmacistId: req.user!.userId,
          pharmacistName,
          pharmacistRegNo,
          decision,
          doctorVerified,
          validityVerified,
          notes,
          rejectionReason
        }
      });

      // Update Prescription Status
      const updatedPrescription = await prisma.prescription.update({
        where: { id },
        data: {
          status: nextStatus,
          pharmacistNotes: notes,
          rejectionReason: rejectionReason || null
        }
      });

      // Audit Log
      await prisma.prescriptionAuditEvent.create({
        data: {
          prescriptionId: id,
          actorId: req.user!.userId,
          actorRole: 'PHARMACIST',
          actorName: pharmacistName,
          action: 'REVIEWED',
          details: `Prescription marked as ${decision} by Registered Pharmacist ${pharmacistName} (Reg: ${pharmacistRegNo})`
        }
      });

      res.json({
        message: `Prescription review recorded as ${decision}`,
        prescription: updatedPrescription,
        review
      });
    } catch (error) {
      console.error('Prescription review error:', error);
      res.status(500).json({ error: 'Failed to submit prescription review' });
    }
  }
);

// Pharmacist Prepares Eligible Quotation
const QuotationItemSchema = z.object({
  medicineId: z.string().optional(),
  medicineName: z.string().min(2),
  dosageStrength: z.string().default(''),
  prescribedQuantity: z.number().int().min(1),
  approvedQuantity: z.number().int().min(0),
  unitPricePaise: z.number().int().min(0),
  isAvailable: z.boolean().default(true),
  substitutionNote: z.string().optional()
});

const CreateQuotationSchema = z.object({
  items: z.array(QuotationItemSchema).min(1, 'Quotation must contain at least one item'),
  deliveryFeePaise: z.number().int().default(0),
  estimatedDeliveryMinutes: z.number().int().default(30),
  pharmacistNotes: z.string().optional()
});

router.post(
  '/console/prescriptions/:id/quotation',
  authenticateToken,
  requireRole('MERCHANT', 'ADMIN'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const parse = CreateQuotationSchema.safeParse(req.body);
      if (!parse.success) {
        res.status(400).json({ error: 'Invalid quotation payload', details: parse.error.errors });
        return;
      }

      const prescription = await prisma.prescription.findUnique({
        where: { id },
        include: { pharmacy: true }
      });

      if (!prescription) {
        res.status(404).json({ error: 'Prescription not found' });
        return;
      }

      const { items, deliveryFeePaise, estimatedDeliveryMinutes, pharmacistNotes } = parse.data;

      let subtotalPaise = 0;
      const calculatedItems = items.map((item) => {
        const itemTotal = item.isAvailable ? item.approvedQuantity * item.unitPricePaise : 0;
        subtotalPaise += itemTotal;
        return {
          ...item,
          totalPricePaise: itemTotal
        };
      });

      const taxPaise = Math.round(subtotalPaise * 0.05); // 5% GST on eligible medicines
      const totalPaise = subtotalPaise + taxPaise + deliveryFeePaise;

      const quotationNumber = `QT-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
      const validUntil = new Date(Date.now() + 24 * 60 * 60 * 1000); // Valid for 24 hours

      const quotation = await prisma.pharmacyQuotation.create({
        data: {
          quotationNumber,
          prescriptionId: id,
          pharmacyId: prescription.pharmacyId!,
          status: 'PENDING_CUSTOMER',
          subtotalPaise,
          taxPaise,
          deliveryFeePaise,
          totalPaise,
          deliveryType: prescription.deliveryType,
          estimatedDeliveryMinutes,
          validUntil,
          pharmacistNotes,
          items: {
            create: calculatedItems.map((item) => ({
              medicineId: item.medicineId,
              medicineName: item.medicineName,
              dosageStrength: item.dosageStrength,
              prescribedQuantity: item.prescribedQuantity,
              approvedQuantity: item.approvedQuantity,
              unitPricePaise: item.unitPricePaise,
              totalPricePaise: item.totalPricePaise,
              isAvailable: item.isAvailable,
              substitutionNote: item.substitutionNote
            }))
          }
        },
        include: { items: true }
      });

      // Update Prescription Status
      await prisma.prescription.update({
        where: { id },
        data: { status: 'AWAITING_CUSTOMER_CONFIRMATION' }
      });

      // Audit Log
      await prisma.prescriptionAuditEvent.create({
        data: {
          prescriptionId: id,
          actorId: req.user!.userId,
          actorRole: 'PHARMACIST',
          action: 'QUOTATION_ISSUED',
          details: `Quotation ${quotationNumber} issued for total amount ₹${(totalPaise / 100).toFixed(2)}`
        }
      });

      res.status(201).json({
        message: 'Pharmacist quotation issued successfully',
        quotation
      });
    } catch (error) {
      console.error('Error creating quotation:', error);
      res.status(500).json({ error: 'Failed to create quotation' });
    }
  }
);

// Customer Confirms Quotation -> Pharmacy Order Created
router.post('/quotations/:id/confirm', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const quotation = await prisma.pharmacyQuotation.findUnique({
      where: { id },
      include: {
        prescription: true,
        items: true,
        pharmacy: true
      }
    });

    if (!quotation) {
      res.status(404).json({ error: 'Quotation not found' });
      return;
    }

    if (quotation.prescription.customerId !== req.user!.userId) {
      res.status(403).json({ error: 'Forbidden: You cannot confirm another customer’s quotation' });
      return;
    }

    if (quotation.status !== 'PENDING_CUSTOMER') {
      res.status(400).json({ error: `Quotation is already ${quotation.status}` });
      return;
    }

    // Check expiry
    if (new Date() > quotation.validUntil) {
      await prisma.pharmacyQuotation.update({
        where: { id },
        data: { status: 'EXPIRED' }
      });
      res.status(400).json({ error: 'Quotation has expired. Please request a refreshed quotation.' });
      return;
    }

    const orderNumber = `RXORD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const order = await prisma.pharmacyOrder.create({
      data: {
        orderNumber,
        prescriptionId: quotation.prescriptionId,
        pharmacyId: quotation.pharmacyId,
        customerId: req.user!.userId,
        totalAmountPaise: quotation.totalPaise,
        status: 'CONFIRMED',
        deliveryType: quotation.deliveryType,
        deliveryAddress: quotation.prescription.deliveryAddress,
        paymentStatus: 'CASH_ON_DELIVERY'
      }
    });

    // Mark quotation ACCEPTED
    await prisma.pharmacyQuotation.update({
      where: { id },
      data: { status: 'ACCEPTED' }
    });

    // Mark prescription ORDER_CREATED
    await prisma.prescription.update({
      where: { id: quotation.prescriptionId },
      data: { status: 'ORDER_CREATED' }
    });

    // Audit Log
    await prisma.prescriptionAuditEvent.create({
      data: {
        prescriptionId: quotation.prescriptionId,
        actorId: req.user!.userId,
        actorRole: 'CUSTOMER',
        action: 'ACCEPTED',
        details: `Customer confirmed quotation. Pharmacy Order ${orderNumber} created.`
      }
    });

    res.status(201).json({
      message: 'Order created successfully! The pharmacy is preparing your medicines.',
      order
    });
  } catch (error) {
    console.error('Error confirming quotation:', error);
    res.status(500).json({ error: 'Failed to confirm quotation' });
  }
});

// Pharmacist Dispense Order (Records statutory batch number, expiry date and pharmacist registration)
const DispenseSchema = z.object({
  pharmacistName: z.string().min(2),
  pharmacistRegNo: z.string().min(4),
  records: z.array(
    z.object({
      medicineName: z.string(),
      batchNumber: z.string().min(2),
      expiryDate: z.string().min(4),
      quantityDispensed: z.number().int().min(1)
    })
  ).min(1)
});

router.post(
  '/console/orders/:id/dispense',
  authenticateToken,
  requireRole('MERCHANT', 'ADMIN'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const parse = DispenseSchema.safeParse(req.body);
      if (!parse.success) {
        res.status(400).json({ error: 'Invalid dispensing details', details: parse.error.errors });
        return;
      }

      const order = await prisma.pharmacyOrder.findUnique({
        where: { id },
        include: { prescription: true, pharmacy: true }
      });

      if (!order) {
        res.status(404).json({ error: 'Pharmacy order not found' });
        return;
      }

      const { pharmacistName, pharmacistRegNo, records } = parse.data;

      // Create Dispensing Records
      for (const rec of records) {
        await prisma.dispensingRecord.create({
          data: {
            orderId: id,
            pharmacistId: req.user!.userId,
            pharmacistName,
            pharmacistRegNo,
            medicineName: rec.medicineName,
            batchNumber: rec.batchNumber,
            expiryDate: rec.expiryDate,
            quantityDispensed: rec.quantityDispensed
          }
        });
      }

      // Update Order Status
      const nextStatus = order.deliveryType === 'COUNTER_PICKUP' ? 'READY_FOR_PICKUP' : 'OUT_FOR_DELIVERY';
      const updatedOrder = await prisma.pharmacyOrder.update({
        where: { id },
        data: {
          status: nextStatus,
          dispensedByPharmacist: `${pharmacistName} (${pharmacistRegNo})`,
          dispensedAt: new Date()
        }
      });

      // Update Prescription Status
      await prisma.prescription.update({
        where: { id: order.prescriptionId },
        data: { status: 'DISPENSED' }
      });

      // Audit Log
      await prisma.prescriptionAuditEvent.create({
        data: {
          prescriptionId: order.prescriptionId,
          actorId: req.user!.userId,
          actorRole: 'PHARMACIST',
          actorName: pharmacistName,
          action: 'DISPENSED',
          details: `Medicines dispensed under registered supervision of ${pharmacistName} (Reg: ${pharmacistRegNo})`
        }
      });

      res.json({
        message: 'Order medicines successfully dispensed and logged to statutory register',
        order: updatedOrder
      });
    } catch (error) {
      console.error('Error dispensing order:', error);
      res.status(500).json({ error: 'Failed to dispense order' });
    }
  }
);

// ====================================================
// 4. PHARMACY ONBOARDING & ADMIN MANAGEMENT
// ====================================================

const OnboardPharmacySchema = z.object({
  name: z.string().min(2),
  legalBusinessName: z.string().min(2),
  addressLine: z.string().min(5),
  locality: z.string().default('Palasia'),
  city: z.string().default('Indore'),
  pincode: z.string().min(6),
  latitude: z.number().default(22.7196),
  longitude: z.number().default(75.8577),
  phone: z.string().min(10),
  email: z.string().email(),
  operatingHours: z.string().default('08:00 AM - 11:00 PM'),
  licenceNumber: z.string().min(5), // Retail Drug Licence (Form 20/21)
  licenceType: z.string().default('FORM_20_21'),
  licenceValidUpto: z.string(), // ISO date
  pharmacistName: z.string().min(2),
  pharmacistRegNo: z.string().min(4),
  pharmacistCouncil: z.string().default('Madhya Pradesh State Pharmacy Council'),
  pharmacistRegValidUpto: z.string()
});

router.post('/onboard', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = OnboardPharmacySchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: 'Validation failed', details: parse.error.errors });
      return;
    }

    const {
      name,
      legalBusinessName,
      addressLine,
      locality,
      city,
      pincode,
      latitude,
      longitude,
      phone,
      email,
      operatingHours,
      licenceNumber,
      licenceType,
      licenceValidUpto,
      pharmacistName,
      pharmacistRegNo,
      pharmacistCouncil,
      pharmacistRegValidUpto
    } = parse.data;

    const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const pharmacy = await prisma.pharmacy.create({
      data: {
        ownerId: req.user!.userId,
        name,
        legalBusinessName,
        slug,
        addressLine: `${addressLine}, ${locality}`,
        city,
        pincode,
        latitude,
        longitude,
        phone,
        email,
        operatingHours,
        isVerified: false,
        verificationStatus: 'UNDER_VERIFICATION',
        licences: {
          create: {
            licenceType,
            licenceNumber,
            issuingAuthority: 'Madhya Pradesh Food and Drugs Administration (FDA)',
            validFrom: new Date(),
            validUpto: new Date(licenceValidUpto),
            status: 'PENDING'
          }
        },
        pharmacists: {
          create: {
            name: pharmacistName,
            registrationNumber: pharmacistRegNo,
            councilName: pharmacistCouncil,
            registrationValidity: new Date(pharmacistRegValidUpto),
            phone,
            email,
            isPrimary: true,
            isActive: true
          }
        }
      },
      include: {
        licences: true,
        pharmacists: true
      }
    });

    res.status(201).json({
      message: 'Pharmacy onboarding application submitted. Admin review of Retail Drug Licences and Pharmacist credentials required.',
      pharmacy
    });
  } catch (error) {
    console.error('Pharmacy onboarding error:', error);
    res.status(500).json({ error: 'Failed to onboard pharmacy' });
  }
});

// Admin List Pharmacies
router.get(
  '/admin/pharmacies',
  authenticateToken,
  requireRole('ADMIN'),
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const pharmacies = await prisma.pharmacy.findMany({
        include: {
          licences: true,
          pharmacists: true,
          _count: { select: { prescriptions: true, orders: true } }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json({ pharmacies });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch pharmacies' });
    }
  }
);

// Admin Verify or Suspend Pharmacy
router.post(
  '/admin/pharmacies/:id/verify',
  authenticateToken,
  requireRole('ADMIN'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { isVerified, verificationStatus, rejectionReason } = req.body;

      const pharmacy = await prisma.pharmacy.update({
        where: { id },
        data: {
          isVerified: isVerified === true,
          verificationStatus: verificationStatus || (isVerified ? 'APPROVED' : 'REJECTED'),
          rejectionReason: rejectionReason || null
        },
        include: { licences: true, pharmacists: true }
      });

      // Update associated licences
      if (isVerified) {
        await prisma.pharmacyLicence.updateMany({
          where: { pharmacyId: id },
          data: { status: 'VERIFIED', verifiedAt: new Date() }
        });
      }

      res.json({ message: 'Pharmacy verification status updated', pharmacy });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update pharmacy verification status' });
    }
  }
);

export default router;
