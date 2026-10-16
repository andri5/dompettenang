import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../utils/prisma.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  parseExpiresIn,
} from '../utils/jwt.js';
import { config } from '../config/index.js';
import { isSmtpConfigured, sendPasswordResetEmail } from './email.service.js';
import type {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from '../utils/validation.js';
import type { AuthResponse, UserResponse } from '../types/index.js';
import { AUTH_SAFE, LOGIN_DUMMY_HASH } from '../constants/authMessages.js';
import { hasProAccess } from '../utils/plan.js';

export class AuthService {
  async register(data: RegisterInput): Promise<AuthResponse> {
    const email = data.email.trim().toLowerCase();
    const existingUser = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });

    if (existingUser) {
      // Same public message as other register failures (anti-enumeration)
      throw new Error(AUTH_SAFE.registerFailed);
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email,
        password: hashedPassword,
        gender: data.gender,
        birthDate: new Date(`${data.birthDate}T00:00:00.000Z`),
      },
    });

    const tokenPayload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    await this.saveRefreshToken(user.id, refreshToken);

    return {
      user: this.formatUser(user),
      accessToken,
      refreshToken,
    };
  }

  async login(data: LoginInput): Promise<AuthResponse> {
    const email = data.email.trim().toLowerCase();
    // Case-insensitive match for legacy accounts stored with mixed casing
    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });

    // Dummy compare when user missing — reduces timing side-channels
    const hash = user?.password ?? LOGIN_DUMMY_HASH;
    const isPasswordValid = await bcrypt.compare(data.password, hash);

    if (!user || !isPasswordValid) {
      throw new Error(AUTH_SAFE.loginFailed);
    }

    const tokenPayload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    await this.saveRefreshToken(user.id, refreshToken);

    return {
      user: this.formatUser(user),
      accessToken,
      refreshToken,
    };
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({
        where: {
          userId,
          token: refreshToken,
        },
      });
    } else {
      await prisma.refreshToken.deleteMany({
        where: { userId },
      });
    }
  }

  /**
   * Issue a new access token. Refresh token is reused (not rotated) so parallel
   * 401→refresh races cannot invalidate each other and wipe cookies.
   */
  async refreshTokens(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = verifyRefreshToken(refreshToken);

    if (!payload) {
      throw new Error(AUTH_SAFE.sessionInvalid);
    }

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!storedToken) {
      throw new Error(AUTH_SAFE.sessionInvalid);
    }

    if (new Date() > storedToken.expiresAt) {
      await prisma.refreshToken.delete({ where: { id: storedToken.id } });
      throw new Error(AUTH_SAFE.sessionInvalid);
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      throw new Error(AUTH_SAFE.sessionInvalid);
    }

    const tokenPayload = { userId: user.id, email: user.email, role: user.role };
    const newAccessToken = generateAccessToken(tokenPayload);

    return {
      accessToken: newAccessToken,
      refreshToken,
    };
  }

  /**
   * Create a password reset token.
   * Always returns a generic message (no email enumeration).
   * resetUrl is only included in development when EXPOSE_PASSWORD_RESET_URL is enabled.
   */
  async forgotPassword(
    data: ForgotPasswordInput
  ): Promise<{ message: string; resetUrl?: string }> {
    const email = data.email.trim().toLowerCase();
    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });

    const generic = {
      message: AUTH_SAFE.forgotPassword,
    };

    if (!user) {
      return generic;
    }

    await prisma.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
    });

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: tokenHash,
        expiresAt,
      },
    });

    const resetUrl = `${config.appUrl.replace(/\/$/, '')}/reset-password?token=${rawToken}`;

    try {
      if (isSmtpConfigured()) {
        await sendPasswordResetEmail({
          to: user.email,
          name: user.name,
          resetUrl,
        });
      } else if (config.isProduction) {
        console.error('[password-reset] SMTP not configured; email not sent');
      } else {
        console.warn('[password-reset] SMTP off — email not sent');
      }
    } catch (err) {
      console.error('[password-reset] Failed to send email', err);
      // Still return generic message (no enumeration / no leak)
    }

    if (config.exposePasswordResetUrl) {
      console.log(`[password-reset:dev] ${user.email} → ${resetUrl}`);
      return { ...generic, resetUrl };
    }

    return generic;
  }

  async resetPassword(data: ResetPasswordInput): Promise<{ message: string }> {
    const tokenHash = crypto.createHash('sha256').update(data.token).digest('hex');

    const record = await prisma.passwordResetToken.findUnique({
      where: { token: tokenHash },
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new Error(AUTH_SAFE.resetInvalid);
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      prisma.refreshToken.deleteMany({
        where: { userId: record.userId },
      }),
      prisma.passwordResetToken.deleteMany({
        where: {
          userId: record.userId,
          id: { not: record.id },
        },
      }),
    ]);

    return { message: 'Password berhasil diubah. Silakan masuk dengan password baru.' };
  }

  async getMe(userId: string): Promise<UserResponse> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        currency: true,
        gender: true,
        birthDate: true,
        role: true,
        plan: true,
        proExpiresAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new Error(AUTH_SAFE.sessionInvalid);
    }

    return this.formatUser(user);
  }

  async updateProfile(
    userId: string,
    data: {
      name?: string;
      currency?: string;
      gender?: 'MALE' | 'FEMALE' | null;
      birthDate?: string | null;
    }
  ): Promise<UserResponse> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.currency !== undefined ? { currency: data.currency } : {}),
        ...(data.gender !== undefined ? { gender: data.gender } : {}),
        ...(data.birthDate !== undefined
          ? {
              birthDate:
                data.birthDate === null
                  ? null
                  : new Date(`${data.birthDate}T00:00:00.000Z`),
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        currency: true,
        gender: true,
        birthDate: true,
        role: true,
        plan: true,
        proExpiresAt: true,
        createdAt: true,
      },
    });

    return this.formatUser(user);
  }

  async changePassword(
    userId: string,
    data: { currentPassword: string; newPassword: string }
  ): Promise<{ message: string; accessToken: string; refreshToken: string }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, password: true },
    });

    if (!user) {
      throw new Error(AUTH_SAFE.changePasswordFailed);
    }

    const isValid = await bcrypt.compare(data.currentPassword, user.password);
    if (!isValid) {
      throw new Error(AUTH_SAFE.changePasswordFailed);
    }

    if (data.currentPassword === data.newPassword) {
      throw new Error(AUTH_SAFE.changePasswordFailed);
    }

    const hashedPassword = await bcrypt.hash(data.newPassword, 12);
    const tokenPayload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      }),
      // Drop other sessions; current tab gets fresh cookies below
      prisma.refreshToken.deleteMany({
        where: { userId },
      }),
    ]);
    await this.saveRefreshToken(user.id, refreshToken);

    return {
      message: 'Password berhasil diubah',
      accessToken,
      refreshToken,
    };
  }

  private async saveRefreshToken(userId: string, token: string): Promise<void> {
    const expiresAt = new Date(Date.now() + parseExpiresIn(config.jwt.refreshExpiresIn));

    await prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });
  }

  private formatUser(user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    currency: string;
    gender?: 'MALE' | 'FEMALE' | 'OTHER' | null;
    birthDate?: Date | null;
    role?: string;
    plan?: 'FREE' | 'PRO' | string | null;
    proExpiresAt?: Date | null;
    createdAt: Date;
  }): UserResponse {
    const gender =
      user.gender === 'MALE' || user.gender === 'FEMALE' ? user.gender : null;
    const storedPlan = user.plan === 'PRO' ? 'PRO' : 'FREE';
    const planUser = {
      role: user.role || 'USER',
      plan: storedPlan,
      proExpiresAt: user.proExpiresAt ?? null,
    };
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      currency: user.currency,
      gender,
      birthDate: user.birthDate
        ? user.birthDate.toISOString().slice(0, 10)
        : null,
      role: user.role || 'USER',
      plan: storedPlan,
      proExpiresAt: user.proExpiresAt
        ? user.proExpiresAt.toISOString()
        : null,
      hasPro: hasProAccess(planUser),
      createdAt: user.createdAt,
    };
  }
}

export const authService = new AuthService();
