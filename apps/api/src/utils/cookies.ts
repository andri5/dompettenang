/**
 * Auth cookie helpers (web HttpOnly). Mobile uses Bearer in Authorization header.
 */

import type { Response } from 'express';
import { config } from '../config/index.js';

const baseCookie = {
  httpOnly: true,
  secure: config.cookie.secure,
  sameSite: config.cookie.sameSite,
  path: '/',
} as const;

export function setAuthCookies(
  res: Response,
  tokens: { accessToken: string; refreshToken: string }
): void {
  res.cookie(config.cookie.accessName, tokens.accessToken, {
    ...baseCookie,
    maxAge: config.cookie.accessMaxAgeSec * 1000,
  });
  res.cookie(config.cookie.refreshName, tokens.refreshToken, {
    ...baseCookie,
    maxAge: config.cookie.refreshMaxAgeSec * 1000,
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(config.cookie.accessName, { ...baseCookie });
  res.clearCookie(config.cookie.refreshName, { ...baseCookie });
}
