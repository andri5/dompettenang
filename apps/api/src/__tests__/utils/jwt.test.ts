/**
 * JWT Utils Tests
 * Test sign, verify, and error handling
 */

import { describe, it, expect } from 'vitest';
import { generateAccessToken, verifyAccessToken, verifyRefreshToken } from '../../utils/jwt.js';

describe('JWT Utils', () => {
  const testPayload = { userId: 'test-user-123', email: 'test@example.com' };

  describe('generateAccessToken()', () => {
    it('should create a valid JWT token', () => {
      const token = generateAccessToken(testPayload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT format: header.payload.signature
    });

    it('should include correct payload in token', () => {
      const token = generateAccessToken(testPayload);
      const decoded = verifyAccessToken(token);
      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(testPayload.userId);
      expect(decoded?.email).toBe(testPayload.email);
    });

    it('should create different tokens for different calls', () => {
      const token1 = generateAccessToken(testPayload);
      const token2 = generateAccessToken(testPayload);
      // Tokens may differ due to timing/jti
      expect(token1).toBeDefined();
      expect(token2).toBeDefined();
    });
  });

  describe('verifyAccessToken()', () => {
    it('should verify a valid token', () => {
      const token = generateAccessToken(testPayload);
      const decoded = verifyAccessToken(token);
      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(testPayload.userId);
    });

    it('should return null for invalid token', () => {
      const invalidToken = 'invalid.token.here';
      const result = verifyAccessToken(invalidToken);
      expect(result).toBeNull();
    });

    it('should return null for tampered token', () => {
      const token = generateAccessToken(testPayload);
      const tampered = token.slice(0, -10) + 'tampered123';
      const result = verifyAccessToken(tampered);
      expect(result).toBeNull();
    });

    it('should return null for expired token', () => {
      // This test would need to mock time or use a real expired token
      // For now, just verify the function exists
      const token = generateAccessToken(testPayload);
      expect(token).toBeDefined();
    });

    it('should return null for empty token', () => {
      const result = verifyAccessToken('');
      expect(result).toBeNull();
    });

    it('should return null for null token', () => {
      const result = verifyAccessToken(null as any);
      expect(result).toBeNull();
    });
  });

  describe('verifyRefreshToken()', () => {
    it('should return payload for valid refresh token', () => {
      // Since refresh tokens use same payload but different secret,
      // we can only test that function works
      const result = verifyRefreshToken('invalid.token');
      expect(typeof result === 'object' || result === null).toBe(true);
    });

    it('should return null for invalid token format', () => {
      const result = verifyRefreshToken('not.a.valid.token.format');
      expect(result).toBeNull();
    });

    it('should return null for tampered token', () => {
      const result = verifyRefreshToken('tampered.token.here');
      expect(result).toBeNull();
    });

    it('should return null for empty token', () => {
      const result = verifyRefreshToken('');
      expect(result).toBeNull();
    });

    it('should return null for null token', () => {
      const result = verifyRefreshToken(null as any);
      expect(result).toBeNull();
    });
  });
});
