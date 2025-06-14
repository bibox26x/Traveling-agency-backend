import { Response, NextFunction, RequestHandler } from 'express';
import { verifyAccessToken, verifyRefreshToken, generateTokens } from '../utils/jwt';
import logger from '../utils/logger';
import prisma from '../lib/prisma';
import { AuthenticatedRequest, TokenPayload } from '../types/auth';

const REFRESH_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

export const authenticateJWT: RequestHandler = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const [bearer, token] = authHeader.split(' ');

    if (bearer !== 'Bearer' || !token) {
      return res.status(401).json({ message: 'Invalid token format' });
    }

    try {
      const payload = verifyAccessToken(token) as TokenPayload;
      req.user = {
        userId: payload.userId,
        role: payload.role
      };
      return next();
    } catch (error) {
      // Access token is invalid, try refresh token
      const refreshToken = req.cookies?.refreshToken;
      
      if (!refreshToken) {
        return res.status(401).json({ message: 'Access token expired and no refresh token provided' });
      }

      try {
        // Verify refresh token
        const { userId } = verifyRefreshToken(refreshToken) as TokenPayload;
        
        // Get user from database
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
          throw new Error('User not found');
        }

        // Generate new tokens
        const { accessToken, refreshToken: newRefreshToken } = generateTokens({
          userId: user.id,
          role: user.role
        });

        // Set new refresh token cookie
        res.cookie('refreshToken', newRefreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

        // Set user in request
        req.user = {
          userId: user.id,
          role: user.role
        };

        // Send new access token
        res.setHeader('Authorization', `Bearer ${accessToken}`);
        return next();
      } catch (refreshError) {
        logger.error('Token refresh failed', { error: refreshError });
        // Clear invalid refresh token
        res.clearCookie('refreshToken', REFRESH_TOKEN_COOKIE_OPTIONS);
        return res.status(401).json({ message: 'Invalid refresh token' });
      }
    }
  } catch (error) {
    logger.error('Authentication error', { error });
    return res.status(500).json({ message: 'Internal server error during authentication' });
  }
};

export const requireRole = (role: string): RequestHandler => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (req.user.role.toLowerCase() !== role.toLowerCase()) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};
