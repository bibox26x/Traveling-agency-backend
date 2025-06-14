import { Router } from 'express';
import { body } from 'express-validator';
import { authenticateJWT, requireRole } from '../middleware/auth';
import validate from '../middleware/validator';
import { AuthenticatedRequestHandler } from '../types/auth';
import {
  getAllPayments,
  getPaymentsByStatus,
  getPaymentStats,
  getDashboardStats,
  getAllBookings,
  updateBookingStatus,
  updatePaymentStatus,
  deleteBooking,
  updateBookingDestination
} from '../controllers/adminController';
import {
  createDestination,
  updateDestination,
  deleteDestination,
  assignTripToDestination,
  removeTripFromDestination
} from '../controllers/destinationController';
import { updateTripDestination } from '../controllers/tripController';

const router = Router();

// Apply authentication and admin role check to all routes
router.use(authenticateJWT as AuthenticatedRequestHandler);
router.use(requireRole('admin'));

// Dashboard
router.get('/stats', getDashboardStats as AuthenticatedRequestHandler);

// Bookings Management
router.get('/bookings', getAllBookings as AuthenticatedRequestHandler);
router.patch(
  '/bookings/:id/status',
  [
    body('status').isIn(['pending', 'confirmed', 'cancelled']).withMessage('Invalid booking status'),
  ],
  validate,
  updateBookingStatus as AuthenticatedRequestHandler
);
router.patch(
  '/bookings/:id/payment-status',
  [
    body('paymentStatus').isIn(['pending', 'paid', 'refunded']).withMessage('Invalid payment status'),
  ],
  validate,
  updatePaymentStatus as AuthenticatedRequestHandler
);
router.delete(
  '/bookings/:id',
  deleteBooking as AuthenticatedRequestHandler
);
router.patch(
  '/bookings/:id/destination',
  [
    body('destinationId').isInt().withMessage('Invalid destination ID'),
  ],
  validate,
  updateBookingDestination as AuthenticatedRequestHandler
);

// Payments
router.get('/payments', getAllPayments as AuthenticatedRequestHandler);
router.get('/payments/status/:status', getPaymentsByStatus as AuthenticatedRequestHandler);
router.get('/payments/stats', getPaymentStats as AuthenticatedRequestHandler);

// Destinations
router.post(
  '/destinations',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('imageUrl').isURL().withMessage('Valid image URL is required'),
    body('country').notEmpty().withMessage('Country is required'),
  ],
  validate,
  createDestination as AuthenticatedRequestHandler
);

router.put(
  '/destinations/:id',
  [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('description').optional().notEmpty().withMessage('Description cannot be empty'),
    body('imageUrl').optional().isURL().withMessage('Image URL must be valid'),
    body('country').optional().notEmpty().withMessage('Country cannot be empty'),
  ],
  validate,
  updateDestination as AuthenticatedRequestHandler
);

router.delete('/destinations/:id', deleteDestination as AuthenticatedRequestHandler);

// Trip-Destination Management
router.post(
  '/destinations/:destinationId/trips',
  [
    body('tripId').isInt().withMessage('Valid trip ID is required'),
  ],
  validate,
  assignTripToDestination as AuthenticatedRequestHandler
);

router.delete(
  '/destinations/:destinationId/trips/:tripId',
  removeTripFromDestination as AuthenticatedRequestHandler
);

// Trip Management
router.patch(
  '/trips/:id/destination',
  [
    body('destinationId').isInt().withMessage('Invalid destination ID'),
  ],
  validate,
  updateTripDestination as AuthenticatedRequestHandler
);

export default router; 