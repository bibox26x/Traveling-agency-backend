import { PrismaClient } from '@prisma/client';
import { PaymentStatus, Payment, PaymentWithEnumStatus, PrismaBooking } from '../types/payment';
import logger from '../utils/logger';

const prisma = new PrismaClient();

interface CreatePaymentData {
  userId: number;
  bookingId: number;
  amount: number;
  paymentMethod: string;
  proofImage?: string | null;
}

export const createPayment = async (data: CreatePaymentData): Promise<PaymentWithEnumStatus> => {
  const { userId, bookingId, amount, paymentMethod, proofImage } = data;

  // Verify booking exists and belongs to user
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      trip: true,
      user: true
    }
  });

  if (!booking) {
    throw new Error('Booking not found');
  }

  if (booking.userId !== userId) {
    throw new Error('Booking does not belong to user');
  }

  // Verify payment amount matches booking amount
  if (amount !== booking.trip.price * booking.guests) {
    throw new Error('Invalid payment amount');
  }

  // Create payment record
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
          trip: {
            select: {
              id: true,
              title: true,
              price: true,
              description: true,
              startDate: true,
              location: true,
              imageUrl: true,
              duration: true,
              destinationId: true,
              createdById: true,
              createdAt: true,
              updatedAt: true
            }
          },
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
  }) as Payment;

  logger.info('Payment created:', { paymentId: payment.id, userId, bookingId });
  return {
    ...payment,
    status: payment.status as PaymentStatus
  };
};

export const getPaymentsByUser = async (userId: number): Promise<PaymentWithEnumStatus[]> => {
  const payments = await prisma.payment.findMany({
    where: { userId },
    include: {
      booking: {
        include: {
          trip: {
            select: {
              id: true,
              title: true,
              price: true,
              description: true,
              startDate: true,
              location: true,
              imageUrl: true,
              duration: true,
              destinationId: true,
              createdById: true,
              createdAt: true,
              updatedAt: true
            }
          },
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
  }) as Payment[];

  return payments.map(payment => ({
    ...payment,
    status: payment.status as PaymentStatus
  }));
};

export const getPaymentsByBooking = async (bookingId: number, userId: number): Promise<Payment[]> => {
  try {
    return await prisma.payment.findMany({
      where: {
        bookingId,
        userId
      },
      include: {
        booking: {
          include: {
            trip: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    logger.error('Get payments by booking error:', error);
    throw error;
  }
};

export const updatePaymentStatus = async (
  paymentId: number,
  status: PaymentStatus,
  adminNote?: string | null
): Promise<PaymentWithEnumStatus> => {
  // Verify payment exists
  const existingPayment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      booking: {
        include: {
          trip: true,
          user: true
        }
      }
    }
  }) as Payment | null;

  if (!existingPayment) {
    throw new Error('Payment not found');
  }

  // Update payment status
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
          trip: {
            select: {
              id: true,
              title: true,
              price: true,
              description: true,
              startDate: true,
              location: true,
              imageUrl: true,
              duration: true,
              destinationId: true,
              createdById: true,
              createdAt: true,
              updatedAt: true
            }
          },
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
  }) as Payment;

  logger.info('Payment status updated:', { 
    paymentId, 
    oldStatus: existingPayment.status as PaymentStatus, 
    newStatus: status 
  });

  return {
    ...payment,
    status: payment.status as PaymentStatus
  };
};

export const getPaymentById = async (paymentId: number): Promise<Payment | null> => {
  try {
    return await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: {
          include: {
            trip: true
          }
        }
      }
    });
  } catch (error) {
    logger.error('Get payment by ID error:', error);
    throw error;
  }
};

export const calculateTotalPayments = async (bookingId: number): Promise<number> => {
  try {
    const result = await prisma.payment.aggregate({
      where: {
        bookingId,
        status: 'confirmed'
      },
      _sum: {
        amount: true
      }
    });

    return result._sum.amount || 0;
  } catch (error) {
    logger.error('Calculate total payments error:', error);
    throw error;
  }
}; 