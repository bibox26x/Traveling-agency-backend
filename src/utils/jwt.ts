import jwt from 'jsonwebtoken';
import { TokenPayload } from '../types/auth';
import { User } from '@prisma/client';
import type { SignOptions } from 'jsonwebtoken';
import type { StringValue } from 'ms';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';
const JWT_EXPIRES_IN_REMEMBER = process.env.JWT_EXPIRES_IN_REMEMBER || '30d';

export const generateTokens = (payload: TokenPayload, rememberMe: boolean = false) => {
  const expiresIn = rememberMe ? JWT_EXPIRES_IN_REMEMBER : JWT_EXPIRES_IN;
  const options: SignOptions = { 
    expiresIn: expiresIn as StringValue 
  };
  
  const accessToken = jwt.sign(payload, JWT_SECRET, options);
  const refreshToken = jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_EXPIRES_IN_REMEMBER as StringValue 
  });
  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid access token');
  }
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};

export const generateAccessTokenFromRefreshToken = (refreshToken: string, rememberMe: boolean = false) => {
  const payload = verifyRefreshToken(refreshToken);
  const expiresIn = rememberMe ? JWT_EXPIRES_IN_REMEMBER : JWT_EXPIRES_IN;
  const options: SignOptions = { 
    expiresIn: expiresIn as StringValue 
  };
  return jwt.sign(payload, JWT_SECRET, options);
};
