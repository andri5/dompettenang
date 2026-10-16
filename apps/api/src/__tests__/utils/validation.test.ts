import { describe, expect, it } from 'vitest';
import {
  createExpenseSchema,
  createFeedbackSchema,
  createSavingsSchema,
  loginSchema,
  registerSchema,
} from '../../utils/validation.js';

describe('validation schemas (OWASP)', () => {
  const validRegister = {
    name: 'Andri Faizal',
    email: '  User@Example.COM ',
    password: 'Strong1!',
    gender: 'MALE' as const,
    birthDate: '1995-05-15',
  };

  describe('registerSchema', () => {
    it('accepts valid payload and normalizes email', () => {
      const parsed = registerSchema.parse(validRegister);
      expect(parsed.email).toBe('user@example.com');
      expect(parsed.name).toBe('Andri Faizal');
    });

    it('rejects short name', () => {
      expect(() =>
        registerSchema.parse({ ...validRegister, name: 'A' })
      ).toThrow();
    });

    it('rejects XSS in name', () => {
      expect(() =>
        registerSchema.parse({ ...validRegister, name: '<script>x</script>' })
      ).toThrow();
    });

    it('rejects weak password (no digit)', () => {
      expect(() =>
        registerSchema.parse({ ...validRegister, password: 'OnlyLetters' })
      ).toThrow();
    });

    it('rejects password longer than bcrypt limit', () => {
      expect(() =>
        registerSchema.parse({
          ...validRegister,
          password: `Aa1${'x'.repeat(70)}`,
        })
      ).toThrow();
    });

    it('rejects invalid birth date calendar', () => {
      expect(() =>
        registerSchema.parse({ ...validRegister, birthDate: '2020-02-30' })
      ).toThrow();
    });
  });

  describe('loginSchema', () => {
    it('normalizes email and caps password length', () => {
      const parsed = loginSchema.parse({
        email: 'Admin@Dompet.id',
        password: 'x',
      });
      expect(parsed.email).toBe('admin@dompet.id');
    });

    it('rejects oversized password (DoS guard)', () => {
      expect(() =>
        loginSchema.parse({
          email: 'a@b.co',
          password: 'x'.repeat(73),
        })
      ).toThrow();
    });
  });

  describe('createExpenseSchema', () => {
    const base = {
      amount: 15000,
      categoryId: '550e8400-e29b-41d4-a716-446655440000',
      date: '2026-10-16',
      note: 'Makan siang',
    };

    it('accepts valid expense', () => {
      const parsed = createExpenseSchema.parse(base);
      expect(parsed.amount).toBe(15000);
      expect(parsed.note).toBe('Makan siang');
    });

    it('rejects HTML in note', () => {
      expect(() =>
        createExpenseSchema.parse({ ...base, note: '<b>hack</b>' })
      ).toThrow();
    });

    it('rejects http receipt URL (https or /uploads only)', () => {
      expect(() =>
        createExpenseSchema.parse({
          ...base,
          receiptUrl: 'http://evil.example/x.png',
        })
      ).toThrow();
    });

    it('allows relative upload path', () => {
      const parsed = createExpenseSchema.parse({
        ...base,
        receiptUrl: '/uploads/receipts/a.jpg',
      });
      expect(parsed.receiptUrl).toBe('/uploads/receipts/a.jpg');
    });
  });

  describe('createSavingsSchema', () => {
    it('accepts valid goal', () => {
      const parsed = createSavingsSchema.parse({
        name: 'Dana darurat',
        targetAmount: 5_000_000,
        deadline: '2027-01-01',
      });
      expect(parsed.name).toBe('Dana darurat');
    });

    it('rejects XSS name', () => {
      expect(() =>
        createSavingsSchema.parse({
          name: 'alert(1)',
          targetAmount: 1000,
        })
      ).not.toThrow();
      expect(() =>
        createSavingsSchema.parse({
          name: '<img onerror=alert(1)>',
          targetAmount: 1000,
        })
      ).toThrow();
    });
  });

  describe('createFeedbackSchema', () => {
    it('accepts safe feedback', () => {
      const parsed = createFeedbackSchema.parse({
        message: 'Sangat membantu!',
        rating: 5,
      });
      expect(parsed.message).toBe('Sangat membantu!');
      expect(parsed.rating).toBe(5);
    });

    it('rejects short / unsafe message', () => {
      expect(() => createFeedbackSchema.parse({ message: 'hi' })).toThrow();
      expect(() =>
        createFeedbackSchema.parse({ message: '<script>x</script>' })
      ).toThrow();
    });
  });
});
