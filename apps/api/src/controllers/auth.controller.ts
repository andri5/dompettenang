import { Request, Response } from 'express';
import { authService } from '../services/auth.service.js';
import { auditService } from '../services/audit.service.js';
import { sendSuccess, sendCreated, sendError, sendUnauthorized } from '../utils/response.js';
import { setAuthCookies, clearAuthCookies } from '../utils/cookies.js';
import { config } from '../config/index.js';
import { AUTH_SAFE } from '../constants/authMessages.js';
import {
  assertCaptchaIfRequired,
  getCaptchaPublicConfig,
} from '../services/turnstile.service.js';
import type {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from '../utils/validation.js';
import type { AuthenticatedRequest } from '../types/index.js';

const CAPTCHA_CLIENT_MSG = 'Verifikasi captcha gagal. Silakan coba lagi.';

function captchaErrorResponse(res: Response, message: string): boolean {
  if (
    message === 'CAPTCHA_REQUIRED' ||
    message === 'CAPTCHA_FAILED' ||
    message === 'CAPTCHA_MISCONFIGURED'
  ) {
    sendError(
      res,
      message === 'CAPTCHA_MISCONFIGURED'
        ? 'Captcha belum dikonfigurasi di server.'
        : CAPTCHA_CLIENT_MSG,
      message === 'CAPTCHA_MISCONFIGURED' ? 503 : 400,
      'CAPTCHA_FAILED'
    );
    return true;
  }
  return false;
}

function readRefreshFromRequest(req: Request): string | undefined {
  const bodyToken = (req.body as { refreshToken?: string } | undefined)?.refreshToken;
  if (bodyToken) return bodyToken;
  return (req as Request & { cookies?: Record<string, string> }).cookies?.[
    config.cookie.refreshName
  ];
}

export class AuthController {
  async captchaConfig(_req: Request, res: Response): Promise<void> {
    const data = await getCaptchaPublicConfig();
    sendSuccess(res, data, 'OK');
  }

  async register(req: Request, res: Response): Promise<void> {
    try {
      const data: RegisterInput = req.body;
      await assertCaptchaIfRequired(data.captchaToken, req.ip);
      const result = await authService.register(data);
      setAuthCookies(res, {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
      sendCreated(res, result, 'Registration successful');
    } catch (error) {
      const message = error instanceof Error ? error.message : AUTH_SAFE.registerFailed;
      if (captchaErrorResponse(res, message)) return;
      // Always same status + message (anti email enumeration)
      if (message !== AUTH_SAFE.registerFailed) {
        console.error('Registration error:', message);
      }
      sendError(res, AUTH_SAFE.registerFailed, 400, 'REGISTRATION_FAILED');
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const data: LoginInput = req.body;
      await assertCaptchaIfRequired(data.captchaToken, req.ip);
      const result = await authService.login(data);
      setAuthCookies(res, {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
      sendSuccess(res, result, 'Login successful');
    } catch (error) {
      const message = error instanceof Error ? error.message : AUTH_SAFE.loginFailed;
      if (captchaErrorResponse(res, message)) return;
      if (message === AUTH_SAFE.loginFailed) {
        sendUnauthorized(res, AUTH_SAFE.loginFailed);
        return;
      }
      console.error('Login error:', message);
      sendError(res, AUTH_SAFE.loginUnavailable, 503, 'LOGIN_UNAVAILABLE');
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = (req as AuthenticatedRequest).user!;
      const refreshToken = readRefreshFromRequest(req);
      await authService.logout(userId, refreshToken);
      clearAuthCookies(res);
      sendSuccess(res, null, 'Logout successful');
    } catch (error) {
      clearAuthCookies(res);
      const message = error instanceof Error ? error.message : 'Logout failed';
      console.error('Logout error:', message);
      sendSuccess(res, null, 'Logout successful');
    }
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = readRefreshFromRequest(req);
      if (!refreshToken) {
        sendUnauthorized(res, AUTH_SAFE.sessionInvalid);
        return;
      }
      const result = await authService.refreshTokens(refreshToken);
      setAuthCookies(res, result);
      sendSuccess(res, result, 'Token refreshed successfully');
    } catch (error) {
      // Do not clear cookies here: parallel refresh races used to wipe a
      // just-rotated session. Client clears on definitive auth failure.
      sendUnauthorized(res, AUTH_SAFE.sessionInvalid);
    }
  }

  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const data: ForgotPasswordInput = req.body;
      await assertCaptchaIfRequired(data.captchaToken, req.ip);
      const result = await authService.forgotPassword(data);
      sendSuccess(res, result, result.message);
    } catch (error) {
      const message = error instanceof Error ? error.message : AUTH_SAFE.forgotPassword;
      if (captchaErrorResponse(res, message)) return;
      console.error('Forgot password error:', message);
      // Still return generic success body to avoid enumeration on failures
      sendSuccess(res, { message: AUTH_SAFE.forgotPassword }, AUTH_SAFE.forgotPassword);
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const data: ResetPasswordInput = req.body;
      const result = await authService.resetPassword(data);
      clearAuthCookies(res);
      sendSuccess(res, result, result.message);
    } catch (error) {
      const message = error instanceof Error ? error.message : AUTH_SAFE.resetInvalid;
      if (message !== AUTH_SAFE.resetInvalid) {
        console.error('Reset password error:', message);
      }
      sendError(res, AUTH_SAFE.resetInvalid, 400, 'RESET_PASSWORD_FAILED');
    }
  }

  async me(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = (req as AuthenticatedRequest).user!;
      const user = await authService.getMe(userId);
      sendSuccess(res, user, 'OK');
    } catch (error) {
      sendUnauthorized(res, AUTH_SAFE.sessionInvalid);
    }
  }

  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = (req as AuthenticatedRequest).user!;
      const data = req.body as { name?: string; currency?: string };
      const user = await authService.updateProfile(userId, data);

      void auditService.log({
        userId,
        actorRole: (req as AuthenticatedRequest).user?.role,
        action: 'UPDATE_PROFILE',
        entityType: 'user',
        entityId: userId,
        summary: 'User update profile',
        metadata: { changed: Object.keys(data ?? {}) },
      });

      sendSuccess(res, user, 'Profil diperbarui');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update profile';
      console.error('Update profile error:', message);
      sendError(res, 'Tidak dapat memperbarui profil. Coba lagi.', 400, 'PROFILE_UPDATE_FAILED');
    }
  }

  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = (req as AuthenticatedRequest).user!;
      const data = req.body as { currentPassword: string; newPassword: string };
      const result = await authService.changePassword(userId, data);
      setAuthCookies(res, {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
      sendSuccess(
        res,
        { message: result.message },
        result.message
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : AUTH_SAFE.changePasswordFailed;
      if (message !== AUTH_SAFE.changePasswordFailed) {
        console.error('Change password error:', message);
      }
      sendError(res, AUTH_SAFE.changePasswordFailed, 400, 'CHANGE_PASSWORD_FAILED');
    }
  }
}

export const authController = new AuthController();
