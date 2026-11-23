import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRouter from './routes/auth';
import customerRouter from './routes/customer';
import merchantRouter from './routes/merchant';
import adminRouter from './routes/admin';
import uploadRouter from './routes/upload';
import locationRouter from './routes/location';
import servicesRouter from './routes/services';
import pharmacyRouter from './routes/pharmacy';
import { riderRouter } from './routes/rider';
import { aiAssistantRouter } from './routes/aiAssistant';
import { householdRouter } from './routes/household';
import { communityRouter } from './routes/community';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// P0 Security: Explicit CORS configuration (No wildcards with credentials)
const envOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : [];

const defaultAllowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  'capacitor://localhost',
  'http://localhost'
];

const allowedOriginsSet = new Set([...envOrigins, ...defaultAllowedOrigins]);

app.use(
  cors({
    origin: (origin, callback) => {
      // In development/test, allow requests with no origin (e.g. mobile apps, server-to-server, curl)
      if (!origin) {
        return callback(null, true);
      }
      if (allowedOriginsSet.has(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS policy violation: origin ${origin} is not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Idempotency-Key'],
    optionsSuccessStatus: 200
  })
);

app.use(express.json());

// Serve uploaded media statically
const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');
app.use('/uploads', express.static(UPLOADS_DIR));

// API Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'HEALTHY',
    service: 'Everything Local Hyperlocal Engine',
    market: 'Indore, MP',
    timestamp: new Date().toISOString()
  });
});

// Mount Modular Routes
app.use('/api/auth', authRouter);
app.use('/api/customer', customerRouter);
app.use('/api/merchant', merchantRouter);
app.use('/api/admin', adminRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/location', locationRouter);
app.use('/api/services', servicesRouter);
app.use('/api/pharmacy', pharmacyRouter);
app.use('/api/rider', riderRouter);
app.use('/api/ai', aiAssistantRouter);
app.use('/api/household', householdRouter);
app.use('/api/community', communityRouter);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(` Everything Local API server running on http://localhost:${PORT}`);
  });
}

export default app;
