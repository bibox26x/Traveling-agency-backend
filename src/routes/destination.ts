import { Router } from 'express';
import { body } from 'express-validator';
import { getAllDestinations, getDestinationById, createDestination, updateDestination, deleteDestination, getDestinationTrips } from '../controllers/destinationController';
import { authenticateJWT, requireRole } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', getAllDestinations);
router.get('/:id', getDestinationById);
router.get('/:id/trips', getDestinationTrips);

// Admin routes
router.post(
  '/',
  authenticateJWT,
  requireRole('admin'),
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('imageUrl').notEmpty().isURL().withMessage('Valid image URL is required'),
    body('country').notEmpty().withMessage('Country is required'),
  ],
  createDestination
);

router.put(
  '/:id',
  authenticateJWT,
  requireRole('admin'),
  [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('description').optional().notEmpty().withMessage('Description cannot be empty'),
    body('imageUrl').optional().isURL().withMessage('Image URL must be a valid URL'),
    body('country').optional().notEmpty().withMessage('Country cannot be empty'),
  ],
  updateDestination
);

router.delete('/:id', authenticateJWT, requireRole('admin'), deleteDestination);

export default router; 