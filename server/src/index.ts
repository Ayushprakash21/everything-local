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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
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

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(` Everything Local API server running on http://localhost:${PORT}`);
  });
}

export default app;
