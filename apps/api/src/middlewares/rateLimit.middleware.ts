/**
 * Rate Limiting Middleware
 * Prevents abuse by limiting requests
 */

import { Request, Response, NextFunction } from 'express';
import { config } from '../config/index.js';

interface RateLimitStore {
  [key: string]: { count: number; resetTime: number };
}

const store: RateLimitStore = {};

/**
 * Rate limiter middleware
 * @param windowMs - Time window in milliseconds
 * @param maxRequests - Max requests per window
 */
export const rateLimit = (windowMs: number, maxRequests: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.ip || 'unknown'}:${req.baseUrl}${req.path}`;
    const now = Date.now();

    if (!store[key] || now > store[key].resetTime) {
      store[key] = { count: 0, resetTime: now + windowMs };
    }

    store[key].count++;

    res.set('X-RateLimit-Limit', maxRequests.toString());
    res.set('X-RateLimit-Remaining', Math.max(0, maxRequests - store[key].count).toString());
    res.set('X-RateLimit-Reset', store[key].resetTime.toString());

    if (store[key].count > maxRequests) {
      res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later',
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil((store[key].resetTime - now) / 1000),
        },
      });
      return;
    }

    next();
  };
};

/** Login/register — stricter in production */
export const authRateLimiter = rateLimit(
  15 * 60 * 1000,
  config.isProduction ? 20 : 60
);

/** Forgot / reset password — prevent token farming */
export const passwordResetRateLimiter = rateLimit(
  60 * 60 * 1000,
  config.isProduction ? 5 : 20
);

/** General API */
export const apiRateLimiter = rateLimit(
  60 * 1000,
  config.isProduction ? 120 : 300
);

export const cleanupRateLimitStore = () => {
  const now = Date.now();
  for (const key in store) {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  }
};

setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
