import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../db';
import { generateToken, authenticateToken } from '../middleware/auth';

const router = Router();

const RegisterSchema = z.object({
  email: z.string().email(),
  phone: z.string().optional(),
  name: z.string().min(2),
  password: z.string().min(6),
  role: z.enum(['CUSTOMER', 'MERCHANT', 'ADMIN']).default('CUSTOMER')
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
  longitude: z.number().optional().default(75.8577),
  autoVerify: z.boolean().optional().default(false)
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
      longitude,
      autoVerify
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
        isVerified: autoVerify === true, // Default false: Pending approval by admin
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
