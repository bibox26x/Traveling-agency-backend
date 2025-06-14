import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import { generateTokens, verifyRefreshToken } from '../utils/jwt';
import logger from '../utils/logger';
import { TokenPayload } from '../types/auth';
import { CookieOptions } from 'express';

const REFRESH_TOKEN_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'none',
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  path: '/'
};

export const register = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.auth('register_validation_failed', { errors: errors.array() });
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password, rememberMe = false } = req.body;
  try {
    logger.auth('register_attempt', { email });

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      logger.auth('register_failed', { email, reason: 'email_exists' });
      return res.status(400).json({ error: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'user'
      }
    });

    const tokenPayload: TokenPayload = {
      userId: user.id,
      role: user.role
    };

    const { accessToken, refreshToken } = generateTokens(tokenPayload, rememberMe);
    res.cookie('refreshToken', refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

    logger.auth('register_success', { 
      userId: user.id,
      email: user.email,
      role: user.role
    });

    res.status(201).json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    logger.error('Registration error:', { 
      error,
      email,
      name,
      requestId: req.headers['x-request-id']
    });
    res.status(500).json({ message: 'Failed to register' });
  }
};

export const login = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.auth('login_validation_failed', { errors: errors.array() });
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password, rememberMe = false } = req.body;
  try {
    logger.auth('login_attempt', { email });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      logger.auth('login_failed', { email, reason: 'user_not_found' });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      logger.auth('login_failed', { email, reason: 'invalid_password' });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const tokenPayload: TokenPayload = {
      userId: user.id,
      role: user.role
    };

    const { accessToken, refreshToken } = generateTokens(tokenPayload, rememberMe);
    res.cookie('refreshToken', refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

    logger.auth('login_success', { 
      userId: user.id,
      email: user.email,
      role: user.role
    });

    res.json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    logger.error('Login error:', { 
      error,
      email,
      requestId: req.headers['x-request-id']
    });
    res.status(500).json({ message: 'Failed to login' });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const refreshTokenCookie = req.cookies?.refreshToken;
    if (!refreshTokenCookie) {
      logger.auth('refresh_token_failed', { reason: 'no_token' });
      return res.status(401).json({ message: 'No refresh token provided' });
    }

    const { userId } = verifyRefreshToken(refreshTokenCookie);
    const user = await prisma.user.findUnique({ 
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });

    if (!user) {
      logger.auth('refresh_token_failed', { reason: 'user_not_found', userId });
      return res.status(401).json({ message: 'User not found' });
    }

    const tokenPayload: TokenPayload = {
      userId: user.id,
      role: user.role
    };

    // Get rememberMe from request body or default to false
    const { rememberMe = false } = req.body;
    const { accessToken, refreshToken } = generateTokens(tokenPayload, rememberMe);
    res.cookie('refreshToken', refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

    logger.auth('refresh_token_success', { userId: user.id });

    res.json({ 
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    logger.error('Token refresh error:', { 
      error,
      requestId: req.headers['x-request-id']
    });
    res.clearCookie('refreshToken', REFRESH_TOKEN_COOKIE_OPTIONS);
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

export const logout = (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  res.clearCookie('refreshToken', {
    ...REFRESH_TOKEN_COOKIE_OPTIONS,
    maxAge: 0
  });
  
  logger.auth('logout', { userId });
  
  res.json({ message: 'Logged out successfully' });
};
