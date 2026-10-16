import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import { sendUnauthorized } from '../utils/response.js';
import { config } from '../config/index.js';
import { AuthenticatedRequest } from '../types/index.js';

function extractBearer(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice('Bearer '.length).trim();
    if (token) return token;
  }
  return null;
}

function extractCookieToken(req: Request): string | null {
  return (
    (req as Request & { cookies?: Record<string, string> }).cookies?.[
      config.cookie.accessName
    ] || null
  );
}

/**
 * Prefer a *valid* Bearer token; if missing/expired, fall back to access cookie.
 * Stale in-memory Bearer must not block a still-valid HttpOnly cookie.
 */
function resolveAccessPayload(req: Request) {
  const bearer = extractBearer(req);
  if (bearer) {
    const fromBearer = verifyAccessToken(bearer);
    if (fromBearer) return fromBearer;
  }

  const cookieToken = extractCookieToken(req);
  if (cookieToken) {
    return verifyAccessToken(cookieToken);
  }

  return null;
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const payload = resolveAccessPayload(req);

  if (!payload) {
    const hasAnyToken = !!(extractBearer(req) || extractCookieToken(req));
    sendUnauthorized(
      res,
      hasAnyToken ? 'Invalid or expired access token' : 'Access token is required'
    );
    return;
  }

  (req as AuthenticatedRequest).user = {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
  };

  next();
};

export const optionalAuthMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const payload = resolveAccessPayload(req);
  if (payload) {
    (req as AuthenticatedRequest).user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };
  }
  next();
};

export const adminMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const user = (req as AuthenticatedRequest).user;
  if (!user || user.role !== 'ADMIN') {
    res.status(403).json({ success: false, message: 'Admin access required' });
    return;
  }
  next();
};
