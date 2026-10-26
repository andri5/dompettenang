/**
 * Dompet Tenang - Application Constants
 */

const envOrigin = (import.meta.env.VITE_API_ORIGIN as string | undefined)?.replace(/\/$/, '');
const envApiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '');

/**
 * Prefer same-origin `/api/v1` (Vite proxy) so HttpOnly cookies work.
 * Override with VITE_API_URL / VITE_API_ORIGIN only for special cases.
 */
export const API_ORIGIN = envOrigin ?? '';
export const API_BASE_URL =
  envApiUrl || (API_ORIGIN ? `${API_ORIGIN}/api/v1` : '/api/v1');

/**
 * Map stored upload path → authenticated API content path (relative to API_BASE_URL).
 */
export function getUploadContentPath(path?: string | null): string | null {
  if (!path) return null;
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('blob:') ||
    path.startsWith('data:')
  ) {
    return path;
  }
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const match = normalized.match(/^\/uploads\/(receipts|avatars|proofs)\/([^/?#]+)$/);
  if (match) {
    return `/uploads/content/${match[1]}/${match[2]}`;
  }
  return normalized;
}

// Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'dompettenang_access_token',
  REFRESH_TOKEN: 'dompettenang_refresh_token',
  USER: 'dompettenang_user',
  THEME: 'dompettenang_theme',
} as const;

export type AppTheme = 'neo' | 'midnight' | 'ocean';

export const THEME_OPTIONS: {
  id: AppTheme;
  name: string;
  description: string;
}[] = [
  {
    id: 'neo',
    name: 'Neo Ledger',
    description: 'Teal terang, bersih, dan fokus',
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Gelap nyaman untuk malam hari',
  },
  {
    id: 'ocean',
    name: 'Ocean Mist',
    description: 'Biru laut lembut dan sejuk',
  },
];


// Pagination
export const DEFAULT_PAGE_SIZE = 10;

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'dd MMM yyyy',
  INPUT: 'yyyy-MM-dd',
} as const;

// Currency
export const CURRENCY = {
  CODE: 'IDR',
  SYMBOL: 'Rp',
  LOCALE: 'id-ID',
} as const;

// Category Colors
export const CATEGORY_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
  '#6366F1', // Indigo
] as const;

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  DASHBOARD: '/dashboard',
  EXPENSES: '/expenses',
  EXPENSE_NEW: '/expenses/new',
  EXPENSE_EDIT: '/expenses/:id/edit',
  INCOMES: '/incomes',
  INCOME_NEW: '/incomes/new',
  INCOME_EDIT: '/incomes/:id/edit',
  CATEGORIES: '/categories',
  BUDGET: '/budget',
  INSIGHT: '/insight',
  RECURRING: '/recurring',
  SAVINGS: '/savings',
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_FEEDBACK: '/admin/feedback',
  ADMIN_TRAFFIC: '/admin/traffic',
  ADMIN_FLAGS: '/admin/flags',
  ADMIN_ACTIVITY: '/admin/activity',
  ADMIN_LEGAL: '/admin/legal',
  ADMIN_PRO: '/admin/pro',
  SETTINGS: '/settings',
  UPGRADE: '/upgrade',
  HELP: '/help',
  TERMS: '/terms',
  PRIVACY: '/privacy',
  MAINTENANCE: '/maintenance',
  NOT_FOUND: '/404',
} as const;

// Query Keys for React Query
export const QUERY_KEYS = {
  CATEGORIES: ['categories'],
  EXPENSES: ['expenses'],
  EXPENSE: (id: string) => ['expense', id],
  INCOMES: ['incomes'],
  INCOME: (id: string) => ['income', id],
  DASHBOARD: ['dashboard'],
  DASHBOARD_SUMMARY: (period: string) => ['dashboard', 'summary', period],
  BUDGET: (month?: string) => ['budget', month ?? 'current'],
} as const;

// Validation
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 72,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 1000,
  AMOUNT_MAX: 999_999_999_999.99,
} as const;
