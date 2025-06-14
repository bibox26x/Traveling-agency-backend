import { Router } from 'express';
import { body } from 'express-validator';
import { getAllTrips, getTripById, createTrip, updateTrip, deleteTrip } from '../controllers/tripController';
import { authenticateJWT, requireRole } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', getAllTrips);
router.get('/:id', getTripById);

// Admin routes
router.post(
  '/',
  authenticateJWT,
  requireRole('admin'),
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('location').notEmpty().withMessage('Location is required'),
    body('startDate').isISO8601().withMessage('Start date must be a valid date'),
    body('endDate').isISO8601().withMessage('End date must be a valid date'),
    body('price').isFloat({ gt: 0 }).withMessage('Price must be greater than 0'),
    body('imageUrl').optional().isURL().withMessage('Image URL must be a valid URL'),
    body('capacity').optional().isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
  ],
  createTrip
);

router.put(
  '/:id',
  authenticateJWT,
  requireRole('admin'),
  [
    body('title').optional().notEmpty().withMessage('Title cannot be empty'),
    body('description').optional().notEmpty().withMessage('Description cannot be empty'),
    body('location').optional().notEmpty().withMessage('Location cannot be empty'),
    body('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
    body('endDate').optional().isISO8601().withMessage('End date must be a valid date'),
    body('price').optional().isFloat({ gt: 0 }).withMessage('Price must be greater than 0'),
    body('imageUrl').optional().isURL().withMessage('Image URL must be a valid URL'),
    body('capacity').optional().isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
  ],
  updateTrip
);

router.delete('/:id', authenticateJWT, requireRole('admin'), deleteTrip);

export default router;
