import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { authMiddleware, validate } from '../middlewares/index.js';
import {
  authRateLimiter,
  passwordResetRateLimiter,
} from '../middlewares/rateLimit.middleware.js';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  changePasswordSchema,
} from '../utils/validation.js';

const router = Router();

router.get('/captcha-config', (req, res) => authController.captchaConfig(req, res));

router.post(
  '/register',
  authRateLimiter,
  validate(registerSchema),
  (req, res) => authController.register(req, res)
);

router.post(
  '/login',
  authRateLimiter,
  validate(loginSchema),
  (req, res) => authController.login(req, res)
);

router.post(
  '/logout',
  authMiddleware,
  (req, res) => authController.logout(req, res)
);

router.post(
  '/refresh-token',
  validate(refreshTokenSchema),
  (req, res) => authController.refreshToken(req, res)
);

/** Alias for clients that call /auth/refresh */
router.post(
  '/refresh',
  validate(refreshTokenSchema),
  (req, res) => authController.refreshToken(req, res)
);

router.get('/me', authMiddleware, (req, res) => authController.me(req, res));

router.put(
  '/profile',
  authMiddleware,
  validate(updateProfileSchema),
  (req, res) => authController.updateProfile(req, res)
);

router.post(
  '/change-password',
  authMiddleware,
  validate(changePasswordSchema),
  (req, res) => authController.changePassword(req, res)
);

router.post(
  '/forgot-password',
  passwordResetRateLimiter,
  validate(forgotPasswordSchema),
  (req, res) => authController.forgotPassword(req, res)
);

router.post(
  '/reset-password',
  passwordResetRateLimiter,
  validate(resetPasswordSchema),
  (req, res) => authController.resetPassword(req, res)
);

export default router;
