import { Request, RequestHandler } from 'express';

export interface TokenPayload {
  userId: number;
  role: string;
}

export interface AuthUser {
  userId: number;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export type AuthenticatedRequest = Request & {
  user: AuthUser;
};

export type AuthenticatedRequestHandler = RequestHandler<
  any,
  any,
  any,
  any,
  { user: AuthUser }
>; 