import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../db';
import { generateToken, authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

const RegisterSchema = z.object({
  email: z.string().email(),
  phone: z.string().optional(),
  name: z.string().min(2),
  password: z.string().min(6),
  role: z.enum(['CUSTOMER', 'MERCHANT']).default('CUSTOMER')
});

const LoginSchema = z.object({
  emailOrPhone: z.string().min(3),
  password: z.string().min(1)
});

const MerchantRegisterSchema = z.object({
  name: z.string().min(2, 'Owner name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Valid 10-digit phone number is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  businessName: z.string().min(2, 'Store name must be at least 2 characters'),
  category: z.string().default('Grocery & Daily Staples'),
  addressLine: z.string().min(5, 'Store address must be at least 5 characters'),
  locality: z.string().default('Palasia'),
  city: z.string().default('Indore'),
  pincode: z.string().min(6).default('452001'),
  latitude: z.number().optional().default(22.7196),
  longitude: z.number().optional().default(75.8577)
});

// Dedicated Merchant Registration & Store Onboarding
router.post('/register-merchant', async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = MerchantRegisterSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: 'Validation failed', details: parse.error.errors });
      return;
    }

    const {
      name,
      email,
      phone,
      password,
      businessName,
      category,
      addressLine,
      locality,
      city,
      pincode,
      latitude,
      longitude
    } = parse.data;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          ...(phone ? [{ phone }] : [])
        ]
      }
    });

    if (existingUser) {
      res.status(409).json({ error: 'An account with this email or phone number already exists' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        phone,
        name,
        passwordHash,
        role: 'MERCHANT'
      }
    });

    const cleanName = businessName.trim();
    const slug = `${cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const store = await prisma.store.create({
      data: {
        ownerId: user.id,
        name: cleanName,
        slug,
        description: `${cleanName} - Neighbourhood store in ${locality}, Indore`,
        category,
        addressLine: `${addressLine}, ${locality}`,
        city: city || 'Indore',
        pincode: pincode || '452001',
        latitude: latitude || 22.7196,
        longitude: longitude || 75.8577,
        isOpen: true,
        isVerified: false, // Statutory KYC: strictly false upon registration; requires ADMIN verification
        commissionRatePct: 3.5,
        serviceRadiusKm: 3.0
      }
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: 'MERCHANT',
      storeId: store.id
    });

    res.status(201).json({
      message: 'Merchant account registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        storeId: store.id,
        store
      }
    });
  } catch (error) {
    console.error('Merchant registration error:', error);
    res.status(500).json({ error: 'Internal server error during merchant registration' });
  }
});

// Register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    // P0 Security Fix: Explicitly reject any attempt to register as an ADMIN
    if (req.body && (req.body.role === 'ADMIN' || req.body.role === 'SUPER_ADMIN')) {
      res.status(403).json({
        error: 'Privilege escalation rejected: Administrative accounts cannot be created via public registration.'
      });
      return;
    }

    const parse = RegisterSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: 'Validation failed', details: parse.error.errors });
      return;
    }

    const { email, phone, name, password, role } = parse.data;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          ...(phone ? [{ phone }] : [])
        ]
      }
    });

    if (existingUser) {
      res.status(409).json({ error: 'User with this email or phone already exists' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        phone,
        name,
        passwordHash,
        role
      }
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role as 'CUSTOMER' | 'MERCHANT' | 'ADMIN'
    });

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
});

// P0 Security: One-time Super-Admin Bootstrap
const BootstrapSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(8, 'Admin password must be at least 8 characters'),
  phone: z.string().optional(),
  bootstrapToken: z.string().optional()
});

router.post('/bootstrap-admin', async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Check if an admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (existingAdmin) {
      res.status(403).json({
        error: 'Admin bootstrap is permanently disabled: An administrator already exists. Use authenticated admin account management.'
      });
      return;
    }

    // 2. Validate token if configured in environment
    const requiredBootstrapToken = process.env.ADMIN_BOOTSTRAP_TOKEN;
    if (requiredBootstrapToken && req.body.bootstrapToken !== requiredBootstrapToken) {
      res.status(401).json({ error: 'Invalid or missing bootstrap authorization token' });
      return;
    }

    const parse = BootstrapSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: 'Validation failed', details: parse.error.errors });
      return;
    }

    const { email, name, password, phone } = parse.data;
    const passwordHash = await bcrypt.hash(password, 12);

    const adminUser = await prisma.user.create({
      data: {
        email,
        name,
        phone,
        passwordHash,
        role: 'ADMIN'
      }
    });

    // Record security audit log
    await prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        action: 'SUPER_ADMIN_BOOTSTRAPPED',
        resourceType: 'User',
        resourceId: adminUser.id,
        detailsJson: JSON.stringify({ email: adminUser.email, timestamp: new Date() }),
        ipAddress: req.ip || req.socket.remoteAddress
      }
    });

    const token = generateToken({
      userId: adminUser.id,
      email: adminUser.email,
      role: 'ADMIN'
    });

    res.status(201).json({
      message: 'Super-admin account bootstrapped successfully. Public bootstrap is now locked.',
      token,
      user: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role
      }
    });
  } catch (err: any) {
    console.error('Bootstrap admin error:', err);
    res.status(500).json({ error: 'Internal server error during admin bootstrap' });
  }
});

// P0 Security: Authenticated Admin Invitation / Creation
router.post(
  '/create-admin',
  authenticateToken,
  requireRole('ADMIN'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const parse = BootstrapSchema.safeParse(req.body);
      if (!parse.success) {
        res.status(400).json({ error: 'Validation failed', details: parse.error.errors });
        return;
      }

      const { email, name, password, phone } = parse.data;

      const existing = await prisma.user.findFirst({
        where: { OR: [{ email }, ...(phone ? [{ phone }] : [])] }
      });

      if (existing) {
        res.status(409).json({ error: 'User with this email or phone already exists' });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const newAdmin = await prisma.user.create({
        data: {
          email,
          name,
          phone,
          passwordHash,
          role: 'ADMIN'
        }
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user!.userId,
          action: 'ADMIN_INVITED',
          resourceType: 'User',
          resourceId: newAdmin.id,
          detailsJson: JSON.stringify({
            invitedBy: req.user!.email,
            newAdminEmail: newAdmin.email
          }),
          ipAddress: req.ip || req.socket.remoteAddress
        }
      });

      res.status(201).json({
        message: 'Administrator account created successfully',
        admin: {
          id: newAdmin.id,
          email: newAdmin.email,
          name: newAdmin.name,
          role: newAdmin.role
        }
      });
    } catch (err: any) {
      console.error('Create admin error:', err);
      res.status(500).json({ error: 'Failed to create admin user' });
    }
  }
);

// Login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = LoginSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: 'Validation failed', details: parse.error.errors });
      return;
    }

    const { emailOrPhone, password } = parse.data;

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: emailOrPhone },
          { phone: emailOrPhone }
        ]
      },
      include: {
        stores: true
      }
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid email/phone or password' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email/phone or password' });
      return;
    }

    const storeId = user.stores[0]?.id;

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role as 'CUSTOMER' | 'MERCHANT' | 'ADMIN',
      storeId
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        role: user.role,
        storeId,
        store: user.stores[0] || null
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// Get Current User Profile
router.get('/me', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: {
        stores: true,
        addresses: true
      }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        role: user.role,
        stores: user.stores,
        addresses: user.addresses
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

export default router;
