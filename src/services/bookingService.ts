import { PrismaClient, Booking, Prisma } from '@prisma/client';
import logger from '../utils/logger';
import { BookingStatus, PaymentStatus } from '../types/booking';

const prisma = new PrismaClient();

interface CreateBookingData {
  userId: number;
  tripId: number;
  guests: number;
  specialRequirements?: string;
}

export const createBooking = async (data: CreateBookingData): Promise<Booking> => {
  try {
    // Check if trip exists
    const trip = await prisma.trip.findUnique({
      where: { id: data.tripId },
      select: { price: true }
    });

    if (!trip) {
      throw new Error('Trip not found');
    }

    // Calculate total price
    const totalPrice = trip.price * data.guests;

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        user: { connect: { id: data.userId } },
        trip: { connect: { id: data.tripId } },
        guests: data.guests,
        totalPrice,
        status: 'pending',
        paymentStatus: 'pending',
        bookingDate: new Date(),
        specialRequirements: data.specialRequirements
      },
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

    return booking;
  } catch (error) {
    logger.error('Create booking error:', error);
    throw error;
  }
};

export const getBookingsByUser = async (userId: number) => {
  try {
    return await prisma.booking.findMany({
      where: { userId },
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
      orderBy: { bookingDate: 'desc' }
    });
  } catch (error) {
    logger.error('Get bookings error:', error);
    throw error;
  }
};

export const getAllBookings = async () => {
  try {
    return await prisma.booking.findMany({
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
      orderBy: { bookingDate: 'desc' }
    });
  } catch (error) {
    logger.error('Get all bookings error:', error);
    throw error;
  }
};

export const cancelBooking = async (userId: number, bookingId: number): Promise<boolean> => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { trip: true }
    });

    if (!booking || booking.userId !== userId) {
      return false;
    }

    // Only allow cancellation of pending or confirmed bookings
    if (booking.status === 'cancelled') {
      throw new Error('Booking is already cancelled');
    }

    // Update the booking status
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'cancelled',
        paymentStatus: booking.paymentStatus === 'pending' ? 'refunded' : booking.paymentStatus
      }
    });

    return true;
  } catch (error) {
    logger.error('Cancel booking error:', error);
    throw error;
  }
};

export const updateBookingStatus = async (bookingId: number, status: BookingStatus): Promise<Booking> => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId }
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Validate status transition
    if (booking.status === 'cancelled' && status !== 'cancelled') {
      throw new Error('Cannot change status of cancelled booking');
    }

    return await prisma.booking.update({
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
  } catch (error) {
    logger.error('Update booking status error:', error);
    throw error;
  }
};

export const updatePaymentStatus = async (bookingId: number, paymentStatus: PaymentStatus): Promise<Booking> => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId }
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Validate payment status transition
    if (booking.status === 'cancelled' && paymentStatus !== 'refunded') {
      throw new Error('Cancelled bookings can only be marked as refunded');
    }

    return await prisma.booking.update({
      where: { id: bookingId },
      data: { paymentStatus },
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
  } catch (error) {
    logger.error('Update payment status error:', error);
    throw error;
  }
};
