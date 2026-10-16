import { describe, expect, it } from 'vitest';
import {
  expenseSchema,
  feedbackSchema,
  loginSchema,
  registerSchema,
  savingsSchema,
} from '@/lib/validations';

describe('FE validation schemas (OWASP)', () => {
  it('login rejects invalid email and long password', () => {
    expect(loginSchema.safeParse({ email: 'bad', password: 'x' }).success).toBe(
      false
    );
    expect(
      loginSchema.safeParse({
        email: 'ok@mail.com',
        password: 'x'.repeat(73),
      }).success
    ).toBe(false);
    expect(
      loginSchema.safeParse({ email: 'ok@mail.com', password: 'secret' }).success
    ).toBe(true);
  });

  it('register requires strong password and safe name', () => {
    const base = {
      name: 'Andri',
      email: 'andri@example.com',
      password: 'Strong1!',
      confirmPassword: 'Strong1!',
      gender: 'MALE' as const,
      birthDate: '1995-05-15',
    };
    expect(registerSchema.safeParse(base).success).toBe(true);
    expect(
      registerSchema.safeParse({ ...base, password: 'weak', confirmPassword: 'weak' })
        .success
    ).toBe(false);
    expect(
      registerSchema.safeParse({ ...base, name: '<b>x</b>' }).success
    ).toBe(false);
    expect(
      registerSchema.safeParse({
        ...base,
        confirmPassword: 'Different1!',
      }).success
    ).toBe(false);
  });

  it('expense rejects unsafe description and bad receipt URL', () => {
    const base = {
      amount: 1000,
      description: 'Makan',
      date: '2026-10-16',
      categoryId: '550e8400-e29b-41d4-a716-446655440000',
    };
    expect(expenseSchema.safeParse(base).success).toBe(true);
    expect(
      expenseSchema.safeParse({ ...base, description: '<script>' }).success
    ).toBe(false);
    expect(
      expenseSchema.safeParse({
        ...base,
        receiptUrl: 'http://evil.test/a.png',
      }).success
    ).toBe(false);
  });

  it('savings and feedback reject XSS', () => {
    expect(
      savingsSchema.safeParse({
        name: 'Liburan',
        targetAmount: 1_000_000,
      }).success
    ).toBe(true);
    expect(
      savingsSchema.safeParse({
        name: '<img src=x onerror=1>',
        targetAmount: 1_000_000,
      }).success
    ).toBe(false);
    expect(
      feedbackSchema.safeParse({ message: 'Bagus sekali aplikasi ini' }).success
    ).toBe(true);
    expect(feedbackSchema.safeParse({ message: 'hi' }).success).toBe(false);
  });
});
