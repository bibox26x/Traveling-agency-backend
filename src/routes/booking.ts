import { Router, RequestHandler } from 'express';
import { body } from 'express-validator';
import { authenticateJWT } from '../middleware/auth';
import { AuthenticatedRequest } from '../types/auth';
import { createBooking as createBookingRaw, getUserBookings as getUserBookingsRaw, cancelBooking as cancelBookingRaw } from '../controllers/bookingController';

const createBooking: RequestHandler = (req, res) => createBookingRaw(req as AuthenticatedRequest, res);
const getUserBookings: RequestHandler = (req, res) => getUserBookingsRaw(req as AuthenticatedRequest, res);
const cancelBooking: RequestHandler = (req, res) => cancelBookingRaw(req as AuthenticatedRequest, res);

const router = Router();

// Book a trip
router.post(
  '/',
  authenticateJWT,
  [
    body('tripId').isInt(),
  ],
  createBooking
);

// Get user's bookings
router.get('/', authenticateJWT, getUserBookings);

// Cancel booking
router.delete('/:id', authenticateJWT, cancelBooking);

export default router;
