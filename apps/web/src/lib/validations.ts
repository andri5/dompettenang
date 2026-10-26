/**
 * Dompet Tenang - Zod Validation Schemas (OWASP-aligned, mirror API rules)
 * FE uses Zod 4 — avoid .transform() on required fields (breaks output inference).
 * Canonicalization/sanitization is enforced on the API.
 */

import { z } from 'zod';
import { VALIDATION } from '@/lib/constants';
import { isSafePlainText } from '@/lib/sanitize';

const safeName = (label: string, min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min, `${label} minimal ${min} karakter`)
    .max(max, `${label} maksimal ${max} karakter`)
    .refine(isSafePlainText, `${label} mengandung karakter tidak diizinkan`);

const strongPassword = z
  .string()
  .min(
    VALIDATION.PASSWORD_MIN_LENGTH,
    `Password minimal ${VALIDATION.PASSWORD_MIN_LENGTH} karakter`
  )
  .max(
    VALIDATION.PASSWORD_MAX_LENGTH,
    `Password maksimal ${VALIDATION.PASSWORD_MAX_LENGTH} karakter`
  )
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

const emailField = z
  .string()
  .trim()
  .min(1, 'Email wajib diisi')
  .max(255, 'Email terlalu panjang')
  .email('Format email tidak valid')
  .toLowerCase();

// Auth Schemas
export const loginSchema = z.object({
  email: emailField,
  password: z
    .string()
    .min(1, 'Password wajib diisi')
    .max(VALIDATION.PASSWORD_MAX_LENGTH, 'Password terlalu panjang'),
});

export const registerSchema = z
  .object({
    name: safeName(
      'Nama',
      VALIDATION.NAME_MIN_LENGTH,
      VALIDATION.NAME_MAX_LENGTH
    ),
    email: emailField,
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
  email: emailField,
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
    .number({ error: 'Jumlah harus berupa angka' })
    .positive('Jumlah harus lebih dari 0')
    .max(VALIDATION.AMOUNT_MAX, 'Jumlah terlalu besar'),
  description: z
    .string()
    .trim()
    .min(1, 'Deskripsi wajib diisi')
    .max(
      VALIDATION.DESCRIPTION_MAX_LENGTH,
      `Deskripsi maksimal ${VALIDATION.DESCRIPTION_MAX_LENGTH} karakter`
    )
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
    .number({ error: 'Target harus angka' })
    .positive('Target harus lebih dari 0')
    .max(VALIDATION.AMOUNT_MAX, 'Target terlalu besar'),
  deadline: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal tidak valid')
    .optional()
    .or(z.literal('')),
});

export const recurringSchema = z.object({
  categoryId: z.string().uuid('Kategori tidak valid'),
  amount: z
    .number({ error: 'Jumlah harus angka' })
    .positive('Jumlah harus lebih dari 0')
    .max(VALIDATION.AMOUNT_MAX, 'Jumlah terlalu besar'),
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']),
  note: z
    .string()
    .trim()
    .max(VALIDATION.DESCRIPTION_MAX_LENGTH)
    .refine(isSafePlainText, 'Catatan mengandung karakter tidak diizinkan')
    .optional()
    .or(z.literal('')),
  startDate: dateYmd,
});

export const feedbackSchema = z.object({
  name: z
    .string()
    .trim()
    .max(VALIDATION.NAME_MAX_LENGTH)
    .refine(
      (v) => v === '' || (v.length >= 2 && isSafePlainText(v)),
      'Nama tidak valid'
    )
    .optional(),
  message: z
    .string()
    .trim()
    .min(3, 'Pesan minimal 3 karakter')
    .max(2000, 'Pesan maksimal 2000 karakter')
    .refine(isSafePlainText, 'Pesan mengandung karakter tidak diizinkan'),
  rating: z.number().int().min(0).max(5).optional(),
});

/** First Zod issue message (Zod 4 uses `.issues`). */
export function firstZodMessage(error: z.ZodError, fallback = 'Data tidak valid') {
  return error.issues[0]?.message || fallback;
}

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
