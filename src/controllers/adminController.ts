import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { RequestHandler } from 'express';
import logger from '../utils/logger';
import { AuthenticatedRequest } from '../types/auth';
import { BookingStatus } from '../types/booking';
import { PaymentStatus } from '../types/payment';

const prisma = new PrismaClient();

const VALID_BOOKING_STATUSES = ['pending', 'confirmed', 'cancelled'] as const;
const VALID_PAYMENT_STATUSES = ['pending', 'paid', 'refunded'] as const;

export const getAllBookings: RequestHandler = async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        trip: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(bookings);
  } catch (error) {
    logger.error('Error fetching all bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
};

export const updateBookingStatus = async (req: AuthenticatedRequest, res: Response) => {
  const bookingId = Number(req.params.id);
  const { status } = req.body;

  try {
    if (isNaN(bookingId)) {
      return res.status(400).json({ error: 'Invalid booking ID' });
    }

    // Validate status
    if (!VALID_BOOKING_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Invalid booking status' });
    }

    // Check if booking exists and belongs to user
    const existingBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
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
    });

    if (!existingBooking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status },
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
    });

    logger.business('booking_status_updated', {
      bookingId,
      newStatus: status,
      adminId: req.user.userId,
      requestId: req.headers['x-request-id']
    });

    res.json(booking);
  } catch (error) {
    logger.error('Error updating booking status:', {
      error,
      bookingId,
      status,
      adminId: req.user.userId
    });
    res.status(500).json({ error: 'Failed to update booking status' });
  }
};

export const updatePaymentStatus = async (req: AuthenticatedRequest, res: Response) => {
  const bookingId = Number(req.params.id);
  const { status } = req.body;

  try {
    if (isNaN(bookingId)) {
      return res.status(400).json({ error: 'Invalid booking ID' });
    }

    // Validate payment status
    if (!VALID_PAYMENT_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Invalid payment status' });
    }

    // Check if booking exists
    const existingBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
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
    });

    if (!existingBooking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: { paymentStatus: status },
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
    });

    logger.business('payment_status_updated', {
      bookingId,
      newStatus: status,
      adminId: req.user.userId,
      requestId: req.headers['x-request-id']
    });

    res.json(booking);
  } catch (error) {
    logger.error('Error updating payment status:', {
      error,
      bookingId,
      status,
      adminId: req.user.userId
    });
    res.status(500).json({ error: 'Failed to update payment status' });
  }
};

export const getDashboardStats: RequestHandler = async (req, res) => {
  try {
    const [
      totalTrips,
      totalDestinations,
      totalBookings,
      totalUsers,
      recentBookings,
      paymentStats
    ] = await Promise.all([
      prisma.trip.count(),
      prisma.destination.count(),
      prisma.booking.count(),
      prisma.user.count(),
      prisma.booking.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
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
      }),
      prisma.payment.groupBy({
        by: ['status'],
        _sum: {
          amount: true
        }
      })
    ]);

    res.json({
      stats: {
        totalTrips,
        totalDestinations,
        totalBookings,
        totalUsers
      },
      recentBookings,
      paymentStats
    });
  } catch (error) {
    logger.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
};

export const getAllPayments: RequestHandler = async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
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
  } catch (error) {
    logger.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
};

export const getPaymentsByStatus: RequestHandler = async (req, res) => {
  const { status } = req.params;
  
  try {
    const payments = await prisma.payment.findMany({
      where: {
        status: status as PaymentStatus
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
  } catch (error) {
    logger.error('Error fetching payments by status:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
};

export const getPaymentStats: RequestHandler = async (req, res) => {
  try {
    const stats = await prisma.payment.groupBy({
      by: ['status'],
      _count: true,
      _sum: {
        amount: true
      }
    });

    res.json(stats);
  } catch (error) {
    logger.error('Error fetching payment stats:', error);
    res.status(500).json({ error: 'Failed to fetch payment statistics' });
  }
};

export const deleteBooking = async (req: AuthenticatedRequest, res: Response) => {
  const bookingId = Number(req.params.id);

  try {
    if (isNaN(bookingId)) {
      return res.status(400).json({ error: 'Invalid booking ID' });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { trip: true }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    await prisma.booking.delete({
      where: { id: bookingId }
    });

    logger.business('booking_deleted', {
      bookingId,
      adminId: req.user.userId,
      requestId: req.headers['x-request-id'],
      tripId: booking.trip.id
    });

    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    logger.error('Error deleting booking:', {
      error,
      bookingId,
      adminId: req.user.userId
    });
    res.status(500).json({ error: 'Failed to delete booking' });
  }
};

export const updateBookingDestination = async (req: AuthenticatedRequest, res: Response) => {
  const bookingId = Number(req.params.id);
  const { destinationId } = req.body;

  try {
    if (isNaN(bookingId)) {
      return res.status(400).json({ error: 'Invalid booking ID' });
    }

    if (isNaN(destinationId)) {
      return res.status(400).json({ error: 'Invalid destination ID' });
    }

    // First check if the destination exists
    const destination = await prisma.destination.findUnique({
      where: { id: destinationId }
    });

    if (!destination) {
      return res.status(404).json({ error: 'Destination not found' });
    }

    // Get the booking with its trip
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { trip: true }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Update the trip's destination
    await prisma.trip.update({
      where: { id: booking.trip.id },
      data: { destinationId }
    });

    // Get the updated booking with all related info
    const updatedBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        trip: {
          include: {
            destination: true
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
    });

    logger.business('booking_destination_updated', {
      bookingId,
      oldDestinationId: booking.trip.destinationId,
      newDestinationId: destinationId,
      adminId: req.user.userId,
      requestId: req.headers['x-request-id']
    });

    res.json(updatedBooking);
  } catch (error) {
    logger.error('Error updating booking destination:', {
      error,
      bookingId,
      destinationId,
      adminId: req.user.userId
    });
    res.status(500).json({ error: 'Failed to update booking destination' });
  }
}; 