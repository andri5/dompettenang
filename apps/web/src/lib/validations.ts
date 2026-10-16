/**
 * Dompet Tenang - Zod Validation Schemas (OWASP-aligned, mirror API)
 */

import { z } from 'zod';
import { VALIDATION } from '@/lib/constants';
import {
  isSafePlainText,
  normalizeMultiline,
  normalizeWhitespace,
} from '@/lib/sanitize';

const PASSWORD_MAX = 72;

const safeName = (label: string, min: number, max: number) =>
  z
    .string()
    .min(1, `${label} wajib diisi`)
    .transform(normalizeWhitespace)
    .refine((v) => v.length >= min, `${label} minimal ${min} karakter`)
    .refine((v) => v.length <= max, `${label} maksimal ${max} karakter`)
    .refine(isSafePlainText, `${label} mengandung karakter tidak diizinkan`);

const strongPassword = z
  .string()
  .min(1, 'Password wajib diisi')
  .min(
    VALIDATION.PASSWORD_MIN_LENGTH,
    `Password minimal ${VALIDATION.PASSWORD_MIN_LENGTH} karakter`
  )
  .max(PASSWORD_MAX, `Password maksimal ${PASSWORD_MAX} karakter`)
  .refine((pwd) => /[A-Za-z]/.test(pwd) && /\d/.test(pwd), {
    message: 'Password harus mengandung huruf dan angka',
  })
  .refine((pwd) => !/\s/.test(pwd), {
    message: 'Password tidak boleh mengandung spasi',
  });

const birthDateSchema = z
  .string()
  .min(1, 'Tanggal lahir wajib diisi')
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal lahir tidak valid')
  .refine((value) => {
    const d = new Date(`${value}T00:00:00`);
    if (Number.isNaN(d.getTime())) return false;
    const now = new Date();
    const min = new Date(now.getFullYear() - 120, now.getMonth(), now.getDate());
    const max = new Date(now.getFullYear() - 10, now.getMonth(), now.getDate());
    return d >= min && d <= max;
  }, 'Usia harus antara 10–120 tahun');

const dateYmd = z
  .string()
  .min(1, 'Tanggal wajib diisi')
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal tidak valid');

// Auth Schemas
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email wajib diisi')
    .max(255, 'Email terlalu panjang')
    .email('Format email tidak valid')
    .trim()
    .toLowerCase(),
  password: z
    .string()
    .min(1, 'Password wajib diisi')
    .max(PASSWORD_MAX, 'Password terlalu panjang'),
});

export const registerSchema = z
  .object({
    name: safeName(
      'Nama',
      VALIDATION.NAME_MIN_LENGTH,
      VALIDATION.NAME_MAX_LENGTH
    ),
    email: z
      .string()
      .min(1, 'Email wajib diisi')
      .max(255, 'Email terlalu panjang')
      .email('Format email tidak valid')
      .trim()
      .toLowerCase(),
    password: strongPassword,
    confirmPassword: z.string().min(1, 'Konfirmasi password wajib diisi'),
    gender: z.enum(['MALE', 'FEMALE'], {
      message: 'Pilih jenis kelamin',
    }),
    birthDate: birthDateSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Password tidak cocok',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email wajib diisi')
    .max(255, 'Email terlalu panjang')
    .email('Format email tidak valid')
    .trim()
    .toLowerCase(),
});

export const resetPasswordSchema = z
  .object({
    password: strongPassword,
    confirmPassword: z.string().min(1, 'Konfirmasi password wajib diisi'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Password tidak cocok',
    path: ['confirmPassword'],
  });

// Category Schemas
export const categorySchema = z.object({
  name: safeName('Nama kategori', 1, 50),
  icon: z
    .string()
    .max(32)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i, 'Ikon tidak valid')
    .optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Warna harus format #RRGGBB')
    .optional(),
  type: z.enum(['EXPENSE', 'INCOME']),
});

// Expense Schemas
export const expenseSchema = z.object({
  amount: z
    .number({ message: 'Jumlah harus berupa angka' })
    .positive('Jumlah harus lebih dari 0')
    .max(VALIDATION.AMOUNT_MAX, 'Jumlah terlalu besar'),
  description: z
    .string()
    .min(1, 'Deskripsi wajib diisi')
    .max(
      VALIDATION.DESCRIPTION_MAX_LENGTH,
      `Deskripsi maksimal ${VALIDATION.DESCRIPTION_MAX_LENGTH} karakter`
    )
    .transform(normalizeMultiline)
    .refine(isSafePlainText, 'Deskripsi mengandung karakter tidak diizinkan'),
  date: dateYmd,
  categoryId: z.string().uuid('Kategori tidak valid'),
  receiptUrl: z
    .string()
    .max(500)
    .refine(
      (value) =>
        value === '' ||
        value.startsWith('/uploads/') ||
        /^https:\/\//i.test(value),
      'URL bukti tidak valid'
    )
    .optional()
    .nullable(),
});

export const savingsSchema = z.object({
  name: safeName('Nama target', 2, 80),
  targetAmount: z
    .number({ message: 'Target harus angka' })
    .positive('Target harus lebih dari 0')
    .max(VALIDATION.AMOUNT_MAX, 'Target terlalu besar'),
  deadline: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined))
    .refine(
      (v) => v === undefined || /^\d{4}-\d{2}-\d{2}$/.test(v),
      'Format tanggal tidak valid'
    ),
});

export const recurringSchema = z.object({
  categoryId: z.string().uuid('Kategori tidak valid'),
  amount: z
    .number({ message: 'Jumlah harus angka' })
    .positive('Jumlah harus lebih dari 0')
    .max(VALIDATION.AMOUNT_MAX, 'Jumlah terlalu besar'),
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']),
  note: z
    .string()
    .max(VALIDATION.DESCRIPTION_MAX_LENGTH)
    .optional()
    .transform((v) => {
      if (!v) return '';
      return normalizeMultiline(v);
    })
    .refine(isSafePlainText, 'Catatan mengandung karakter tidak diizinkan'),
  startDate: dateYmd,
});

export const feedbackSchema = z.object({
  name: z
    .string()
    .max(VALIDATION.NAME_MAX_LENGTH)
    .transform(normalizeWhitespace)
    .refine((v) => v === '' || (v.length >= 2 && isSafePlainText(v)), 'Nama tidak valid')
    .optional(),
  message: z
    .string()
    .min(3, 'Pesan minimal 3 karakter')
    .max(2000, 'Pesan maksimal 2000 karakter')
    .transform(normalizeMultiline)
    .refine(isSafePlainText, 'Pesan mengandung karakter tidak diizinkan'),
  rating: z.number().int().min(0).max(5).optional(),
});

// Types from schemas
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type CategoryFormData = z.infer<typeof categorySchema>;
export type ExpenseFormData = z.infer<typeof expenseSchema>;
export type SavingsFormData = z.infer<typeof savingsSchema>;
export type RecurringFormData = z.infer<typeof recurringSchema>;
export type FeedbackFormData = z.infer<typeof feedbackSchema>;
