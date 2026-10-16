/**
 * Token storage — access token in memory, refresh in sessionStorage.
 * Keeps Bearer auth for mobile clients while reducing persistent XSS surface on web.
 */

import { STORAGE_KEYS } from './constants';

let accessTokenMemory: string | null = null;

export function getAccessToken(): string | null {
  return accessTokenMemory;
}

export function setAccessToken(token: string | null): void {
  accessTokenMemory = token;
}

export function getRefreshToken(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  } catch {
    return null;
  }
}

export function setRefreshToken(token: string | null): void {
  try {
    if (token) {
      sessionStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
    } else {
      sessionStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    }
  } catch {
    // ignore quota / private mode
  }
}

/** One-time migration from older localStorage token keys */
export function migrateLegacyTokens(): void {
  try {
    const legacyAccess = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const legacyRefresh = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

    if (legacyRefresh && !getRefreshToken()) {
      setRefreshToken(legacyRefresh);
    }
    if (legacyAccess && !getAccessToken()) {
      setAccessToken(legacyAccess);
    }

    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  } catch {
    // ignore
  }
}

export function clearTokens(): void {
  accessTokenMemory = null;
  setRefreshToken(null);
  try {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  } catch {
    // ignore
  }
}
