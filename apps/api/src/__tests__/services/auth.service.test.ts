/**
 * Auth Service Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import bcrypt from 'bcryptjs';

vi.mock('../../utils/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    refreshToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    passwordResetToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      deleteMany: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn((args: unknown[]) => Promise.all(args)),
  },
}));

vi.mock('../../utils/jwt', () => ({
  generateAccessToken: vi.fn(() => 'mock-access-token'),
  generateRefreshToken: vi.fn(() => 'mock-refresh-token'),
  verifyRefreshToken: vi.fn(),
  parseExpiresIn: vi.fn(() => 7 * 24 * 60 * 60 * 1000),
}));

vi.mock('../../config/index', () => ({
  config: {
    jwt: { secret: 'test', expiresIn: '15m', refreshSecret: 'test-r', refreshExpiresIn: '7d' },
    appUrl: 'http://localhost:5173',
    isProduction: false,
    exposePasswordResetUrl: true,
  },
}));

vi.mock('../../services/email.service', () => ({
  isSmtpConfigured: vi.fn(() => false),
  sendPasswordResetEmail: vi.fn(),
}));

import { prisma } from '../../utils/prisma.js';
import { verifyRefreshToken } from '../../utils/jwt.js';
import { AuthService } from '../../services/auth.service.js';

const auth = new AuthService();

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  password: '', // set per test
  name: 'Test User',
  avatar: null,
  currency: 'IDR',
  gender: 'MALE' as const,
  birthDate: new Date('1995-05-15'),
  role: 'USER' as const,
  plan: 'FREE' as const,
  proExpiresAt: null,
  createdAt: new Date('2026-01-01'),
};

const registerPayload = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'Strong1!',
  gender: 'MALE' as const,
  birthDate: '1995-05-15',
};

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── register ──────────────────────────────────────────────

  describe('register()', () => {
    it('should register a new user with valid data', async () => {
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      (prisma.user.create as ReturnType<typeof vi.fn>).mockResolvedValue({ ...mockUser, password: 'hashed' });

      const result = await auth.register(registerPayload);

      expect(prisma.user.create).toHaveBeenCalledOnce();
      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBe('mock-refresh-token');
      expect(result.user.email).toBe('test@example.com');
      expect((result.user as unknown as Record<string, unknown>).password).toBeUndefined();
    });

    it('should fail if email already exists', async () => {
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);

      await expect(
        auth.register({ ...registerPayload, name: 'A' })
      ).rejects.toThrow(
        'Tidak dapat membuat akun. Coba email lain atau masuk jika sudah punya akun.'
      );
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should not store plaintext password', async () => {
      const plaintext = 'MyP@ssw0rd!';
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      (prisma.user.create as ReturnType<typeof vi.fn>).mockImplementation(async ({ data }: { data: { password: string } }) => {
        expect(data.password).not.toBe(plaintext);
        const isHashed = await bcrypt.compare(plaintext, data.password);
        expect(isHashed).toBe(true);
        return { ...mockUser, password: data.password };
      });

      await auth.register({
        ...registerPayload,
        name: 'A',
        email: 'new@example.com',
        password: plaintext,
      });
      expect(prisma.user.create).toHaveBeenCalledOnce();
    });
  });

  // ── login ─────────────────────────────────────────────────

  describe('login()', () => {
    const hashedPw = bcrypt.hashSync('Correct1!', 10);

    it('should return tokens for valid credentials', async () => {
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ ...mockUser, password: hashedPw });

      const result = await auth.login({ email: 'test@example.com', password: 'Correct1!' });

      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBe('mock-refresh-token');
      expect(result.user.id).toBe('user-123');
    });

    it('should fail for non-existent user', async () => {
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(
        auth.login({ email: 'nobody@example.com', password: 'Anything1!' })
      ).rejects.toThrow('Email atau password salah');
    });

    it('should fail for wrong password', async () => {
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ ...mockUser, password: hashedPw });

      await expect(
        auth.login({ email: 'test@example.com', password: 'WrongPass1!' })
      ).rejects.toThrow('Email atau password salah');
    });

    it('should not leak user information in error', async () => {
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      const err1 = await auth.login({ email: 'a@b.c', password: 'x' }).catch((e: Error) => e);

      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ ...mockUser, password: hashedPw });
      const err2 = await auth.login({ email: 'test@example.com', password: 'wrong' }).catch((e: Error) => e);

      expect((err1 as Error).message).toBe((err2 as Error).message);
    });
  });

  // ── refreshTokens ─────────────────────────────────────────

  describe('refreshTokens()', () => {
    it('should return new tokens for valid refresh token', async () => {
      (verifyRefreshToken as ReturnType<typeof vi.fn>).mockReturnValue({ userId: 'user-123', email: 'test@example.com' });
      (prisma.refreshToken.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'rt-1',
        token: 'old-rt',
        userId: 'user-123',
        expiresAt: new Date(Date.now() + 86400000),
      });
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);

      const result = await auth.refreshTokens('old-rt');

      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBe('mock-refresh-token');
      expect(prisma.refreshToken.delete).toHaveBeenCalledOnce();
    });

    it('should fail for invalid refresh token', async () => {
      (verifyRefreshToken as ReturnType<typeof vi.fn>).mockReturnValue(null);

      await expect(auth.refreshTokens('bad-token')).rejects.toThrow(
        'Sesi tidak valid. Silakan masuk lagi.'
      );
    });

    it('should fail for expired refresh token', async () => {
      (verifyRefreshToken as ReturnType<typeof vi.fn>).mockReturnValue({ userId: 'user-123', email: 'test@example.com' });
      (prisma.refreshToken.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'rt-1',
        token: 'expired-rt',
        userId: 'user-123',
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(auth.refreshTokens('expired-rt')).rejects.toThrow(
        'Sesi tidak valid. Silakan masuk lagi.'
      );
    });
  });

  // ── getMe ─────────────────────────────────────────────────

  describe('getMe()', () => {
    it('should return user for valid userId', async () => {
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);

      const result = await auth.getMe('user-123');
      expect(result.id).toBe('user-123');
      expect(result.email).toBe('test@example.com');
    });

    it('should fail for non-existent userId', async () => {
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(auth.getMe('nobody')).rejects.toThrow(
        'Sesi tidak valid. Silakan masuk lagi.'
      );
    });
  });
});
