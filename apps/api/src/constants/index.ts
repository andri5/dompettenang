/**
 * ============================================
 * Dompet Tenang API - Constants
 * ============================================
 * Centralized constants for the application.
 * Import from this file for consistent values.
 * ============================================
 */

// ==================== HTTP STATUS CODES ====================
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// ==================== ERROR CODES ====================
/**
 * Standardized error codes for API responses.
 * Format: DOMAIN_ACTION_ERROR
 */
export const ERROR_CODES = {
  // Auth Errors
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_EMAIL_EXISTS: 'AUTH_EMAIL_EXISTS',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  AUTH_REFRESH_FAILED: 'AUTH_REFRESH_FAILED',

  // User Errors
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_UPDATE_FAILED: 'USER_UPDATE_FAILED',

  // Category Errors
  CATEGORY_NOT_FOUND: 'CATEGORY_NOT_FOUND',
  CATEGORY_CREATE_FAILED: 'CATEGORY_CREATE_FAILED',
  CATEGORY_UPDATE_FAILED: 'CATEGORY_UPDATE_FAILED',
  CATEGORY_DELETE_FAILED: 'CATEGORY_DELETE_FAILED',
  CATEGORY_HAS_EXPENSES: 'CATEGORY_HAS_EXPENSES',
  CATEGORY_IS_DEFAULT: 'CATEGORY_IS_DEFAULT',

  // Expense Errors
  EXPENSE_NOT_FOUND: 'EXPENSE_NOT_FOUND',
  EXPENSE_CREATE_FAILED: 'EXPENSE_CREATE_FAILED',
  EXPENSE_UPDATE_FAILED: 'EXPENSE_UPDATE_FAILED',
  EXPENSE_DELETE_FAILED: 'EXPENSE_DELETE_FAILED',

  // Budget Errors
  BUDGET_NOT_FOUND: 'BUDGET_NOT_FOUND',
  BUDGET_CREATE_FAILED: 'BUDGET_CREATE_FAILED',
  BUDGET_UPDATE_FAILED: 'BUDGET_UPDATE_FAILED',
  BUDGET_DELETE_FAILED: 'BUDGET_DELETE_FAILED',

  // Validation Errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',

  // General Errors
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

// ==================== TYPE EXPORTS ====================
export type HttpStatus = typeof HTTP_STATUS[keyof typeof HTTP_STATUS];
export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
