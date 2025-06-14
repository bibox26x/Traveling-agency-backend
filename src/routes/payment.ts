import { Router } from 'express';
import { body } from 'express-validator';
import { authenticateJWT, requireRole } from '../middleware/auth';
import { createPayment, getUserPayments, updatePaymentStatus, getPaymentsByBooking } from '../controllers/paymentController';

const router = Router();

// Create payment record
router.post(
  '/',
  authenticateJWT,
  [
    body('bookingId').notEmpty(),
    body('amount').isFloat({ gt: 0 }),
    body('paymentMethod').isIn(['cash', 'bank_transfer']),
    body('proofImage').optional().isString(),
  ],
  createPayment
);

// Get user's payments
router.get('/mine', authenticateJWT, getUserPayments);

// Get payments for a specific booking
router.get('/booking/:bookingId', authenticateJWT, getPaymentsByBooking);

// Update payment status (admin only)
router.patch(
  '/:id/status',
  authenticateJWT,
  requireRole('admin'),
  [
    body('status').isIn(['pending', 'confirmed', 'rejected']),
    body('adminNote').optional().isString(),
  ],
  updatePaymentStatus
);

export default router; 