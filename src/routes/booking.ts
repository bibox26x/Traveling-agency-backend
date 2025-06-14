import { Router } from 'express';
import { body } from 'express-validator';
import { authenticateJWT } from '../middleware/auth';
import { createBooking, getUserBookings, cancelBooking } from '../controllers/bookingController';

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
