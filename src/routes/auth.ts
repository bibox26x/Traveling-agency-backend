import { Router } from 'express';
import { body } from 'express-validator';
import { login, register, refreshToken, logout } from '../controllers/authController';
import validate from '../middleware/validator';

const router = Router();

// Login route
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Invalid email format'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  ],
  validate,
  login
);

// Register route
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Invalid email format'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
  ],
  validate,
  register
);

// Refresh token route
router.post('/refresh', refreshToken);

// Logout route
router.post('/logout', logout);

export default router;
