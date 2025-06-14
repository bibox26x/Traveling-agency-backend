import { Response } from 'express';
import { validationResult } from 'express-validator';
import * as bookingService from '../services/bookingService';
import logger from '../utils/logger';
import { AuthenticatedRequest } from '../types/auth';

export const createBooking = async (req: AuthenticatedRequest, res: Response) => {
  const start = Date.now();
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.business('booking_validation_failed', {
        errors: errors.array(),
        userId: req.user.userId
      });
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.userId;
    const { tripId, guests, specialRequirements } = req.body;

    logger.business('booking_attempt', {
      userId,
      tripId,
      guests,
      requestId: req.headers['x-request-id']
    });

    if (!tripId || !guests || guests < 1) {
      logger.business('booking_invalid_data', {
        userId,
        tripId,
        guests,
        requestId: req.headers['x-request-id']
      });
      return res.status(400).json({ error: 'Invalid booking data' });
    }

    const booking = await bookingService.createBooking({
      userId,
      tripId,
      guests,
      specialRequirements
    });

    const duration = Date.now() - start;
    logger.performance('create_booking', duration, {
      userId,
      tripId,
      bookingId: booking.id
    });

    logger.business('booking_success', {
      userId,
      tripId,
      bookingId: booking.id,
      guests,
      requestId: req.headers['x-request-id']
    });

    res.status(201).json(booking);
  } catch (err: any) {
    const duration = Date.now() - start;
    logger.error('Create booking error:', {
      error: err,
      userId: req.user.userId,
      tripId: req.body.tripId,
      guests: req.body.guests,
      duration: `${duration}ms`,
      requestId: req.headers['x-request-id']
    });

    if (err.message === 'Trip not found' || err.message === 'Not enough spots available') {
      res.status(400).json({ error: err.message });
    } else {
      res.status(500).json({ error: 'Failed to create booking' });
    }
  }
};

export const getUserBookings = async (req: AuthenticatedRequest, res: Response) => {
  const start = Date.now();
  try {
    const userId = req.user.userId;

    logger.business('fetch_user_bookings', {
      userId,
      requestId: req.headers['x-request-id']
    });

    const bookings = await bookingService.getBookingsByUser(userId);

    const duration = Date.now() - start;
    logger.performance('get_user_bookings', duration, {
      userId,
      bookingsCount: bookings.length
    });

    res.json(bookings);
  } catch (err) {
    const duration = Date.now() - start;
    logger.error('Get user bookings error:', {
      error: err,
      userId: req.user.userId,
      duration: `${duration}ms`,
      requestId: req.headers['x-request-id']
    });
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
};

export const cancelBooking = async (req: AuthenticatedRequest, res: Response) => {
  const start = Date.now();
  try {
    const userId = req.user.userId;
    const bookingId = Number(req.params.id);

    logger.business('cancel_booking_attempt', {
      userId,
      bookingId,
      requestId: req.headers['x-request-id']
    });

    if (isNaN(bookingId)) {
      logger.business('cancel_booking_invalid_id', {
        userId,
        bookingId: req.params.id,
        requestId: req.headers['x-request-id']
      });
      return res.status(400).json({ error: 'Invalid booking ID' });
    }

    const success = await bookingService.cancelBooking(userId, bookingId);
    if (!success) {
      logger.business('cancel_booking_not_found', {
        userId,
        bookingId,
        requestId: req.headers['x-request-id']
      });
      return res.status(404).json({ error: 'Booking not found or not authorized' });
    }

    const duration = Date.now() - start;
    logger.performance('cancel_booking', duration, {
      userId,
      bookingId
    });

    logger.business('cancel_booking_success', {
      userId,
      bookingId,
      requestId: req.headers['x-request-id']
    });

    res.json({ message: 'Booking canceled successfully' });
  } catch (err) {
    const duration = Date.now() - start;
    logger.error('Cancel booking error:', {
      error: err,
      userId: req.user.userId,
      bookingId: req.params.id,
      duration: `${duration}ms`,
      requestId: req.headers['x-request-id']
    });
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
};
