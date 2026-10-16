/**
 * ============================================
 * Dompet Tenang API - JWT Utilities
 * ============================================
 * Token generation and verification utilities.
 * Handles access tokens and refresh tokens.
 * 
 * @see https://jwt.io/ for JWT documentation
 * ============================================
 */

import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

/**
 * Payload structure for JWT tokens
 */
export interface TokenPayload {
  userId: string;
  email: string;
  role?: string;
}

/**
 * Generate an access token for authentication
 * @param payload - User data to encode in token
 * @returns Signed JWT access token
 */
export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  } as any);
};

/**
 * Generate a refresh token for token renewal
 * @param payload - User data to encode in token
 * @returns Signed JWT refresh token
 */
export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  } as any);
};

/**
 * Verify and decode an access token
 * @param token - JWT access token to verify
 * @returns Decoded payload or null if invalid
 */
export const verifyAccessToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, config.jwt.secret) as TokenPayload;
  } catch {
    return null;
  }
};

/**
 * Verify and decode a refresh token
 * @param token - JWT refresh token to verify
 * @returns Decoded payload or null if invalid
 */
export const verifyRefreshToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, config.jwt.refreshSecret) as TokenPayload;
  } catch {
    return null;
  }
};

/**
 * Parse expiration string to milliseconds
 * @param expiresIn - Expiration string (e.g., '15m', '7d', '1h')
 * @returns Expiration in milliseconds
 * 
 * @example
 * parseExpiresIn('15m') // Returns 900000 (15 minutes)
 * parseExpiresIn('7d')  // Returns 604800000 (7 days)
 */
export const parseExpiresIn = (expiresIn: string): number => {
  const match = expiresIn.match(/^(\d+)([smhdw])$/);
  if (!match) return 900000; // Default 15 minutes

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    s: 1000,                      // seconds
    m: 60 * 1000,                 // minutes
    h: 60 * 60 * 1000,            // hours
    d: 24 * 60 * 60 * 1000,       // days
    w: 7 * 24 * 60 * 60 * 1000,   // weeks
  };

  return value * (multipliers[unit] || 900000);
};
