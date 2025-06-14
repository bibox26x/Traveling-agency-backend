import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { requestLogger, errorLogger } from './utils/logger';
import authRoutes from './routes/auth';
import tripRoutes from './routes/trip';
import bookingRoutes from './routes/booking';
import paymentRoutes from './routes/payment';
import adminRoutes from './routes/admin';
import destinationRoutes from './routes/destination';

const app = express();

// Configure CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(cookieParser());
app.use(express.json());
app.use(requestLogger);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/destinations', destinationRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Error handling interface
interface ApiError extends Error {
  status?: number;
  errors?: Array<{
    msg: string;
    param: string;
    location: string;
  }>;
}

// Error logging middleware
app.use(errorLogger);

// Error handler
app.use((err: ApiError, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal server error',
    errors: err.errors
  });
});

export default app; 