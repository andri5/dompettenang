/**
 * Dompet Tenang - Utility Functions
 */

import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { CURRENCY, DATE_FORMATS } from './constants';

/**
 * Format amount as currency (defaults to IDR; pass user.currency when available)
 */
export function formatCurrency(amount: number, currencyCode: string = CURRENCY.CODE): string {
  const code = (currencyCode || CURRENCY.CODE).toUpperCase().slice(0, 3);
  const locale =
    code === 'USD' ? 'en-US' : code === 'SGD' ? 'en-SG' : code === 'MYR' ? 'ms-MY' : CURRENCY.LOCALE;
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 0,
      maximumFractionDigits: code === 'IDR' ? 0 : 2,
    }).format(amount);
  } catch {
    return new Intl.NumberFormat(CURRENCY.LOCALE, {
      style: 'currency',
      currency: CURRENCY.CODE,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }
}

/**
 * Format date for display
 */
export function formatDate(
  date: string | Date,
  formatStr: string = DATE_FORMATS.DISPLAY
): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr, { locale: idLocale });
}

/**
 * Format date for API
 */
export function formatDateForApi(date: Date): string {
  return date.toISOString();
}

/**
 * Format date for input
 */
export function formatDateForInput(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, DATE_FORMATS.INPUT);
}

/**
 * Combine class names (simple alternative to clsx)
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Get initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Generate random ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Sleep/delay utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if object is empty
 */
export function isEmpty(obj: object): boolean {
  return Object.keys(obj).length === 0;
}

/**
 * Get error message from unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unexpected error occurred';
}
