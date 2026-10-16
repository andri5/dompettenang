/**
 * Axios API client — cookie session (web) + optional Bearer (mobile/legacy)
 */

import axios from 'axios';
import type {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from 'axios';
import { API_BASE_URL, STORAGE_KEYS } from './constants';
import {
  clearTokens,
  getAccessToken,
  setAccessToken,
  setRefreshToken,
} from './tokenStore';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
  withCredentials: true,
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Prefer Bearer when present (mobile / dual-mode); otherwise cookies carry the session
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (typeof FormData !== 'undefined' && config.data instanceof FormData && config.headers) {
      if (typeof config.headers.delete === 'function') {
        config.headers.delete('Content-Type');
      } else {
        delete (config.headers as Record<string, unknown>)['Content-Type'];
      }
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

const AUTH_NO_REFRESH_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/refresh',
  '/auth/refresh-token',
];

/** Frontend routes where a failed session must NOT hard-redirect to login */
const NO_LOGIN_REDIRECT_PATHS = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/terms',
  '/privacy',
  '/help',
  '/maintenance',
  '/404',
];

function isAuthCredentialRequest(url?: string): boolean {
  if (!url) return false;
  return AUTH_NO_REFRESH_PATHS.some((path) => url.includes(path));
}

function shouldRedirectToLogin(): boolean {
  const path = window.location.pathname || '/';
  // Exact match for home; prefix match for nested public routes
  return !NO_LOGIN_REDIRECT_PATHS.some((p) =>
    p === '/' ? path === '/' : path === p || path.startsWith(`${p}/`)
  );
}

/** Single-flight refresh — parallel 401s share one refresh call */
let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    // Cookies are authoritative on web (withCredentials). Do not send a
    // sessionStorage refresh in the body — it can be stale after password change
    // and would override a valid HttpOnly cookie on the server.
    const response = await axios.post(
      `${API_BASE_URL}/auth/refresh-token`,
      {},
      { withCredentials: true }
    );

    const { accessToken, refreshToken: newRefreshToken } = response.data.data || {};
    if (accessToken) setAccessToken(accessToken);
    if (newRefreshToken) setRefreshToken(newRefreshToken);
    return accessToken || null;
  })().finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
}

function clearClientSession(): void {
  clearTokens();
  localStorage.removeItem(STORAGE_KEYS.USER);
  try {
    // Keep persist shape; drop auth so PublicRoute does not bounce to dashboard
    const raw = localStorage.getItem('dompettenang-auth');
    if (raw) {
      const parsed = JSON.parse(raw) as { state?: Record<string, unknown>; version?: number };
      localStorage.setItem(
        'dompettenang-auth',
        JSON.stringify({
          ...parsed,
          state: {
            ...(parsed.state || {}),
            user: null,
            isAuthenticated: false,
          },
        })
      );
    }
  } catch {
    localStorage.removeItem('dompettenang-auth');
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (
      error.response?.status === 401 &&
      isAuthCredentialRequest(originalRequest?.url)
    ) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Drop stale in-memory Bearer so retries can rely on HttpOnly cookies
        // if refresh body is empty / delayed.
        setAccessToken(null);
        if (originalRequest.headers) {
          delete originalRequest.headers.Authorization;
          if (typeof originalRequest.headers.delete === 'function') {
            originalRequest.headers.delete('Authorization');
          }
        }

        const accessToken = await refreshAccessToken();

        if (accessToken && originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        return api(originalRequest);
      } catch (refreshError) {
        // Only clear session when the server rejects the refresh.
        // Network/timeouts/429 must NOT force logout (common "logout tiba-tiba").
        const refreshStatus = (refreshError as AxiosError | undefined)?.response?.status;
        if (refreshStatus === 401 || refreshStatus === 403) {
          clearClientSession();
          try {
            window.dispatchEvent(new Event('dd:session-expired'));
          } catch {
            // ignore
          }
          if (shouldRedirectToLogin()) {
            window.location.assign('/login');
          }
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
