import { Response } from 'express';
import { validationResult } from 'express-validator';
import { PaymentStatus } from '../types/payment';
import logger from '../utils/logger';
import { AuthenticatedRequest } from '../types/auth';
import { RequestHandler } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createPayment: RequestHandler = async (req: any, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.userId;
    const { bookingId, amount, paymentMethod, proofImage } = req.body;

    if (!bookingId || !amount || !paymentMethod) {
      return res.status(400).json({ error: 'Missing required payment information' });
    }

    const payment = await prisma.payment.create({
      data: {
        userId,
        bookingId,
        amount,
        paymentMethod,
        proofImage: proofImage || null,
        status: PaymentStatus.PENDING,
        adminNote: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      include: {
        booking: {
          include: {
            trip: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    res.status(201).json(payment);
  } catch (err: any) {
    logger.error('Create payment error:', err);
    if (err.message === 'Booking not found' || err.message === 'Invalid payment amount') {
      res.status(400).json({ error: err.message });
    } else {
      res.status(500).json({ error: 'Failed to create payment' });
    }
  }
};

export const getUserPayments: RequestHandler = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const payments = await prisma.payment.findMany({
      where: { userId },
      include: {
        booking: {
          include: {
            trip: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(payments);
  } catch (err) {
    logger.error('Get user payments error:', err);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
};

export const getPaymentsByBooking: RequestHandler = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const bookingId = Number(req.params.bookingId);

    if (isNaN(bookingId)) {
      return res.status(400).json({ error: 'Invalid booking ID' });
    }

    const payments = await prisma.payment.findMany({
      where: { 
        userId,
        bookingId 
      },
      include: {
        booking: {
          include: {
            trip: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(payments);
  } catch (err) {
    logger.error('Get payments by booking error:', err);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
};

export const updatePaymentStatus: RequestHandler = async (req: any, res: Response) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can update payment status' });
    }

    const paymentId = Number(req.params.id);
    const { status, adminNote } = req.body;

    if (!paymentId || !status) {
      return res.status(400).json({ error: 'Missing required information' });
    }

    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status,
        adminNote: adminNote || null,
        updatedAt: new Date()
      },
      include: {
        booking: {
          include: {
            trip: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    res.json(payment);
  } catch (err) {
    logger.error('Update payment status error:', err);
    res.status(500).json({ error: 'Failed to update payment status' });
  }
}; 