/**
 * ============================================
 * Dompet Tenang API - Validation Schemas
 * ============================================
 * Zod schemas aligned with OWASP Input Validation:
 * whitelist types, max lengths, canonicalize, reject unsafe text.
 * ============================================
 */

import { z } from 'zod';
import {
  isSafeIconKey,
  isSafePlainText,
  normalizeMultiline,
  normalizeWhitespace,
} from './sanitize.js';

// ==================== SHARED ====================

/** bcrypt truncates at 72 bytes — cap to avoid DoS / silent truncation. */
const PASSWORD_MAX = 72;
const NOTE_MAX = 1000;
const NAME_MAX = 100;
const EMAIL_MAX = 255;
const SEARCH_MAX = 100;
const AMOUNT_MAX = 999_999_999_999.99;

const safePlainText = (label: string, max: number) =>
  z
    .string()
    .max(max, `${label} terlalu panjang`)
    .transform(normalizeWhitespace)
    .refine((v) => v.length > 0, `${label} wajib diisi`)
    .refine(isSafePlainText, `${label} mengandung karakter tidak diizinkan`);

const optionalSafeNote = z
  .string()
  .max(NOTE_MAX, 'Catatan terlalu panjang')
  .optional()
  .transform((v) => {
    if (v === undefined || v === '') return undefined;
    return normalizeMultiline(v);
  })
  .refine(
    (v) => v === undefined || isSafePlainText(v),
    'Catatan mengandung karakter tidak diizinkan'
  );

const emailSchema = z
  .string()
  .max(EMAIL_MAX, 'Email terlalu panjang')
  .email('Format email tidak valid')
  .transform((v) => v.trim().toLowerCase());

const strongPassword = z
  .string()
  .min(8, 'Password minimal 8 karakter')
  .max(PASSWORD_MAX, `Password maksimal ${PASSWORD_MAX} karakter`)
  .refine((value) => /[A-Za-z]/.test(value) && /\d/.test(value), {
    message: 'Password harus mengandung huruf dan angka',
  })
  .refine((value) => !/\s/.test(value), {
    message: 'Password tidak boleh mengandung spasi',
  });

const genderSchema = z.enum(['MALE', 'FEMALE'], {
  message: 'Jenis kelamin tidak valid',
});

const birthDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal lahir: YYYY-MM-DD')
  .refine((value) => {
    const d = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(d.getTime())) return false;
    const iso = d.toISOString().slice(0, 10);
    if (iso !== value) return false;
    const now = new Date();
    const min = new Date(now.getFullYear() - 120, now.getMonth(), now.getDate());
    const max = new Date(now.getFullYear() - 10, now.getMonth(), now.getDate());
    return d >= min && d <= max;
  }, 'Tanggal lahir tidak valid (usia 10–120 tahun)');

const dateYmdSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal: YYYY-MM-DD')
  .refine((value) => {
    const d = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(d.getTime())) return false;
    return d.toISOString().slice(0, 10) === value;
  }, 'Tanggal tidak valid');

const amountSchema = z
  .number({ message: 'Jumlah harus angka' })
  .finite('Jumlah tidak valid')
  .positive('Jumlah harus lebih dari 0')
  .max(AMOUNT_MAX, 'Jumlah terlalu besar');

const uuidSchema = z.string().uuid('ID tidak valid');

const currencySchema = z
  .string()
  .length(3, 'Mata uang harus 3 karakter')
  .regex(/^[A-Za-z]{3}$/, 'Kode mata uang tidak valid')
  .transform((v) => v.toUpperCase());

const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Warna harus format #RRGGBB');

const iconSchema = z
  .string()
  .min(1, 'Ikon wajib')
  .max(32, 'Ikon terlalu panjang')
  .refine(isSafeIconKey, 'Ikon tidak valid');

export const transactionTypeSchema = z.enum(['EXPENSE', 'INCOME']);

// ==================== AUTH ====================

export const registerSchema = z.object({
  name: safePlainText('Nama', NAME_MAX).refine(
    (v) => v.length >= 2,
    'Nama minimal 2 karakter'
  ),
  email: emailSchema,
  password: strongPassword,
  gender: genderSchema,
  birthDate: birthDateSchema,
  captchaToken: z.string().max(2048).optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(1, 'Password wajib diisi')
    .max(PASSWORD_MAX, 'Password terlalu panjang'),
  captchaToken: z.string().max(2048).optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1).max(2048).optional(),
});

// ==================== USER ====================

export const updateProfileSchema = z.object({
  name: safePlainText('Nama', NAME_MAX)
    .refine((v) => v.length >= 2, 'Nama minimal 2 karakter')
    .optional(),
  currency: currencySchema.optional(),
  gender: genderSchema.optional().nullable(),
  birthDate: birthDateSchema.optional().nullable(),
});

export const adminUpdateUserSchema = z.object({
  name: safePlainText('Nama', NAME_MAX)
    .refine((v) => v.length >= 2, 'Nama minimal 2 karakter')
    .optional(),
  email: emailSchema.optional(),
  currency: currencySchema.optional(),
  gender: genderSchema.optional().nullable(),
  birthDate: birthDateSchema.optional().nullable(),
  role: z.enum(['USER', 'ADMIN']).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'Password saat ini wajib')
    .max(PASSWORD_MAX, 'Password terlalu panjang'),
  newPassword: strongPassword,
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
  captchaToken: z.string().max(2048).optional(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token reset wajib').max(512, 'Token tidak valid'),
  password: strongPassword,
});

// ==================== CATEGORY ====================

export const createCategorySchema = z.object({
  name: safePlainText('Nama kategori', 50),
  icon: iconSchema,
  color: hexColorSchema,
  type: transactionTypeSchema.default('EXPENSE'),
});

export const updateCategorySchema = createCategorySchema.partial();

export const categoryQuerySchema = z.object({
  type: transactionTypeSchema.optional(),
});

// ==================== EXPENSE ====================

const receiptUrlSchema = z
  .string()
  .max(500, 'URL bukti terlalu panjang')
  .refine(
    (value) =>
      value === '' ||
      /^\/uploads\/[A-Za-z0-9._/-]+$/.test(value) ||
      /^https:\/\/[^\s<>"']+$/i.test(value),
    'URL bukti tidak valid (hanya /uploads/ atau https://)'
  )
  .optional()
  .nullable();

export const createExpenseSchema = z
  .object({
    amount: amountSchema,
    categoryId: uuidSchema,
    type: transactionTypeSchema.default('EXPENSE'),
    note: optionalSafeNote,
    description: optionalSafeNote,
    date: z
      .string()
      .refine(
        (value) => /^\d{4}-\d{2}-\d{2}/.test(value),
        'Tanggal harus format YYYY-MM-DD'
      )
      .transform((value) => value.slice(0, 10))
      .pipe(dateYmdSchema),
    receiptUrl: receiptUrlSchema,
  })
  .transform((data) => ({
    amount: data.amount,
    categoryId: data.categoryId,
    type: data.type,
    note: data.note ?? data.description,
    date: data.date,
    receiptUrl: data.receiptUrl || null,
  }));

export const updateExpenseSchema = z
  .object({
    amount: amountSchema.optional(),
    categoryId: uuidSchema.optional(),
    type: transactionTypeSchema.optional(),
    note: optionalSafeNote,
    description: optionalSafeNote,
    date: z
      .string()
      .refine(
        (value) => /^\d{4}-\d{2}-\d{2}/.test(value),
        'Tanggal harus format YYYY-MM-DD'
      )
      .transform((value) => value.slice(0, 10))
      .pipe(dateYmdSchema)
      .optional(),
    receiptUrl: receiptUrlSchema,
  })
  .transform((data) => ({
    amount: data.amount,
    categoryId: data.categoryId,
    type: data.type,
    note: data.note ?? data.description,
    date: data.date,
    receiptUrl: data.receiptUrl === undefined ? undefined : data.receiptUrl || null,
  }));

export const expenseQuerySchema = z.object({
  page: z.coerce.number().int().positive().max(10_000).default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  startDate: dateYmdSchema.optional(),
  endDate: dateYmdSchema.optional(),
  categoryId: uuidSchema.optional(),
  type: transactionTypeSchema.optional(),
  search: z
    .string()
    .max(SEARCH_MAX)
    .transform(normalizeWhitespace)
    .refine(isSafePlainText, 'Pencarian mengandung karakter tidak diizinkan')
    .optional(),
  sortBy: z.enum(['date', 'amount', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const dashboardQuerySchema = z.object({
  period: z.enum(['week', 'month', 'year']).default('month'),
  startDate: dateYmdSchema.optional(),
  endDate: dateYmdSchema.optional(),
});

// ==================== BUDGET ====================

export const createBudgetSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Bulan harus format YYYY-MM'),
  totalBudget: amountSchema,
  categoryBudgets: z
    .array(
      z.object({
        categoryId: uuidSchema,
        amount: amountSchema,
      })
    )
    .max(100, 'Terlalu banyak kategori anggaran')
    .optional(),
});

export const updateBudgetSchema = createBudgetSchema.partial();

export const budgetQuerySchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, 'Bulan harus format YYYY-MM')
    .optional(),
});

// ==================== RECURRING ====================

export const createRecurringSchema = z.object({
  categoryId: uuidSchema,
  type: transactionTypeSchema.optional(),
  amount: amountSchema,
  note: optionalSafeNote,
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']),
  startDate: dateYmdSchema,
  endDate: dateYmdSchema.optional(),
});

export const setRecurringActiveSchema = z.object({
  isActive: z.boolean(),
});

// ==================== SAVINGS ====================

export const createSavingsSchema = z.object({
  name: safePlainText('Nama target', 80),
  targetAmount: amountSchema,
  deadline: dateYmdSchema.optional().nullable(),
  icon: iconSchema.optional(),
  color: hexColorSchema.optional(),
});

export const updateSavingsSchema = z.object({
  name: safePlainText('Nama target', 80).optional(),
  targetAmount: amountSchema.optional(),
  savedAmount: z
    .number()
    .finite()
    .min(0, 'Jumlah tersimpan tidak boleh negatif')
    .max(AMOUNT_MAX)
    .optional(),
  deadline: dateYmdSchema.optional().nullable(),
  icon: iconSchema.optional(),
  color: hexColorSchema.optional(),
});

export const addSavingsAmountSchema = z.object({
  amount: amountSchema,
});

// ==================== FEEDBACK ====================

export const createFeedbackSchema = z.object({
  name: z
    .string()
    .max(NAME_MAX)
    .optional()
    .nullable()
    .transform((v) => {
      if (v == null || v === '') return null;
      return normalizeWhitespace(v);
    })
    .refine(
      (v) => v === null || (v.length >= 2 && isSafePlainText(v)),
      'Nama tidak valid'
    ),
  message: z
    .string()
    .min(1, 'Pesan wajib diisi')
    .max(2000, 'Pesan maksimal 2000 karakter')
    .transform(normalizeMultiline)
    .refine((v) => v.length >= 3, 'Pesan minimal 3 karakter')
    .refine(isSafePlainText, 'Pesan mengandung karakter tidak diizinkan'),
  rating: z.coerce.number().int().min(0).max(5).default(0),
});

// ==================== TYPE EXPORTS ====================

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CategoryQueryInput = z.infer<typeof categoryQuerySchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ExpenseQueryInput = z.infer<typeof expenseQuerySchema>;
export type DashboardQueryInput = z.infer<typeof dashboardQuerySchema>;
export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
export type BudgetQueryInput = z.infer<typeof budgetQuerySchema>;
export type TransactionTypeInput = z.infer<typeof transactionTypeSchema>;
export type CreateRecurringInput = z.infer<typeof createRecurringSchema>;
export type CreateSavingsInput = z.infer<typeof createSavingsSchema>;
export type UpdateSavingsInput = z.infer<typeof updateSavingsSchema>;
export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;
