import type { Request, Response, NextFunction } from 'express';
import { verifySessionToken, type SessionTokenPayload } from '../auth.ts';
import { db } from '../db.ts';
import type { UserRole } from '../../types/index.ts';

export interface AuthenticatedRequest extends Request {
  user?: SessionTokenPayload;
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Authentication required. Missing Bearer token.' });
  }

  const token = authHeader.split(' ')[1];
  const session = verifySessionToken(token);
  if (!session) {
    return res.status(401).json({ success: false, error: 'Session expired or invalid. Please log in again.' });
  }

  const syncedUser = db.ensureUserFromSession(session);
  req.user = {
    ...session,
    userId: syncedUser.id,
  };
  next();
}

export function optionalAuthenticate(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const session = verifySessionToken(token);
    if (session) {
      const syncedUser = db.ensureUserFromSession(session);
      req.user = {
        ...session,
        userId: syncedUser.id,
      };
    }
  }
  next();
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Requires one of the following roles: ${allowedRoles.join(', ')}. Current role: ${req.user.role}`,
      });
    }

    next();
  };
}
