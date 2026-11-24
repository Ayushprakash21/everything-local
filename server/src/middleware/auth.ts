import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const DEFAULT_DEV_SECRET = 'everything_local_indore_secure_jwt_secret_key_2026';

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret === 'everything_local_indore_jwt_prod_key_2026_secured_cf') {
    throw new Error('SECURITY FATAL: Insecure or compromised JWT secret detected.');
  }
  const isProd = process.env.NODE_ENV === 'production';
  if (isProd) {
    if (!secret) {
      throw new Error('SECURITY FATAL: JWT_SECRET environment variable is required in production.');
    }
    if (secret.length < 32) {
      throw new Error('SECURITY FATAL: JWT_SECRET must be at least 32 characters in production.');
    }
    if (
      secret === DEFAULT_DEV_SECRET ||
      secret.includes('example') ||
      secret.includes('placeholder') ||
      secret.includes('test_secret')
    ) {
      throw new Error('SECURITY FATAL: JWT_SECRET cannot be a default or example placeholder in production.');
    }
    return secret;
  }
  return secret || DEFAULT_DEV_SECRET;
}

export const JWT_SECRET = getJwtSecret();

export interface AuthUser {
  userId: string;
  id?: string;
  email: string;
  role: 'CUSTOMER' | 'MERCHANT' | 'ADMIN' | 'RIDER' | 'PHARMACIST' | string;
  storeId?: string;
}

export type AuthRequest = Request & { user?: AuthUser };

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function generateToken(payload: AuthUser): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    if (decoded && decoded.userId && !decoded.id) {
      decoded.id = decoded.userId;
    }
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired token' });
    return;
  }
}

export const requireAuth = authenticateToken;

export function optionalAuthenticateToken(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    next();
    return;
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    if (decoded && decoded.userId && !decoded.id) {
      decoded.id = decoded.userId;
    }
    req.user = decoded;
  } catch (e) {
    // optional token: ignore invalid
  }
  next();
}

export const optionalAuth = optionalAuthenticateToken;

export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: `Forbidden: requires role ${allowedRoles.join(' or ')}` });
      return;
    }

    next();
  };
}
