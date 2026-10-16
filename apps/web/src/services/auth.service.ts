/**
 * Dompet Tenang - Auth Service
 * Web: HttpOnly cookies via withCredentials
 * Mobile: store access/refresh from JSON body in SecureStore (Bearer)
 */

import api from '@/lib/api';
import { STORAGE_KEYS } from '@/lib/constants';
import {
  clearTokens,
  getAccessToken,
  migrateLegacyTokens,
  setAccessToken,
  setRefreshToken,
} from '@/lib/tokenStore';
import type {
  ApiResponse,
  AuthTokens,
  LoginCredentials,
  RegisterData,
  User,
} from '@/types';

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export async function register(data: RegisterData): Promise<AuthResponse> {
  const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', data);
  return response.data.data;
}

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
  return response.data.data;
}

export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout', {});
  } finally {
    clearAuthData();
  }
}

export async function refreshToken(token?: string): Promise<AuthTokens> {
  const response = await api.post<ApiResponse<AuthTokens>>(
    '/auth/refresh-token',
    token ? { refreshToken: token } : {}
  );
  return response.data.data;
}

export async function getCurrentUser(): Promise<User> {
  const response = await api.get<ApiResponse<User>>('/auth/me');
  return response.data.data;
}

export async function forgotPassword(
  email: string,
  captchaToken?: string
): Promise<{ message: string; resetUrl?: string }> {
  const response = await api.post<ApiResponse<{ message: string; resetUrl?: string }>>(
    '/auth/forgot-password',
    { email, ...(captchaToken ? { captchaToken } : {}) }
  );
  return response.data.data;
}

export async function resetPassword(
  token: string,
  password: string
): Promise<{ message: string }> {
  const response = await api.post<ApiResponse<{ message: string }>>('/auth/reset-password', {
    token,
    password,
  });
  return response.data.data;
}

export async function updateProfile(data: {
  name?: string;
  currency?: string;
  gender?: 'MALE' | 'FEMALE' | null;
  birthDate?: string | null;
}): Promise<User> {
  const response = await api.put<ApiResponse<User>>('/auth/profile', data);
  const user = response.data.data;
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  return user;
}

export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ message: string }> {
  const response = await api.post<ApiResponse<{ message: string }>>(
    '/auth/change-password',
    data
  );
  return response.data.data;
}

/**
 * Persist user profile. Tokens stay in HttpOnly cookies for web;
 * optionally mirror in memory for Bearer dual-mode (e.g. tests).
 */
export function saveAuthData(data: AuthResponse): void {
  // Do not put tokens in localStorage. Cookies are authoritative for web.
  // Keep a short-lived memory copy so Authorization can be sent if cookies
  // are unavailable (e.g. some mobile webviews) — still not persisted.
  setAccessToken(data.accessToken);
  setRefreshToken(data.refreshToken);
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
}

export function clearAuthData(): void {
  clearTokens();
  localStorage.removeItem(STORAGE_KEYS.USER);
}

export function getStoredUser(): User | null {
  const userStr = localStorage.getItem(STORAGE_KEYS.USER);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return !!getStoredUser() || !!getAccessToken();
}

/**
 * Restore session: cookies → /auth/me, else refresh cookie → /me
 */
export async function restoreSession(): Promise<User | null> {
  migrateLegacyTokens();

  try {
    const user = await getCurrentUser();
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    return user;
  } catch {
    // try refresh via cookie
  }

  try {
    // Avoid sending a stale memory Bearer during bootstrap refresh
    setAccessToken(null);
    const tokens = await refreshToken();
    if (tokens?.accessToken) setAccessToken(tokens.accessToken);
    if (tokens?.refreshToken) setRefreshToken(tokens.refreshToken);
    const user = await getCurrentUser();
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    return user;
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    // Transient failures must not wipe a still-valid cookie session
    if (status === 429 || status === 503 || status === undefined) {
      return getStoredUser();
    }
    clearAuthData();
    return null;
  }
}
