import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from './config.js';

export type AuthUser = { id: number; username: string; fullName: string };

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function signToken(user: AuthUser): string {
  return jwt.sign(user, config.jwtSecret, { expiresIn: '30d' });
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Sign in to continue.' });
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret) as AuthUser;
    req.user = { id: payload.id, username: payload.username, fullName: payload.fullName };
    next();
  } catch {
    res.status(401).json({ error: 'Your session expired. Sign in again.' });
  }
}
