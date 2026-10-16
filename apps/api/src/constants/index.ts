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

// ==================== SUCCESS MESSAGES ====================
export const SUCCESS_MESSAGES = {
  // Auth
  REGISTER_SUCCESS: 'Registration successful',
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  TOKEN_REFRESHED: 'Token refreshed successfully',

  // User
  PROFILE_RETRIEVED: 'Profile retrieved successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
  PASSWORD_CHANGED: 'Password changed successfully',

  // Category
  CATEGORIES_RETRIEVED: 'Categories retrieved successfully',
  CATEGORY_RETRIEVED: 'Category retrieved successfully',
  CATEGORY_CREATED: 'Category created successfully',
  CATEGORY_UPDATED: 'Category updated successfully',
  CATEGORY_DELETED: 'Category deleted successfully',

  // Expense
  EXPENSES_RETRIEVED: 'Expenses retrieved successfully',
  EXPENSE_RETRIEVED: 'Expense retrieved successfully',
  EXPENSE_CREATED: 'Expense created successfully',
  EXPENSE_UPDATED: 'Expense updated successfully',
  EXPENSE_DELETED: 'Expense deleted successfully',

  // Dashboard
  DASHBOARD_RETRIEVED: 'Dashboard summary retrieved successfully',

  // Budget
  BUDGETS_RETRIEVED: 'Budgets retrieved successfully',
  BUDGET_RETRIEVED: 'Budget retrieved successfully',
  BUDGET_CREATED: 'Budget created successfully',
  BUDGET_UPDATED: 'Budget updated successfully',
  BUDGET_DELETED: 'Budget deleted successfully',
} as const;

// ==================== DEFAULT VALUES ====================
export const DEFAULTS = {
  CURRENCY: 'IDR',
  PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  RECENT_EXPENSES_LIMIT: 5,
  TOP_CATEGORIES_LIMIT: 5,
} as const;

// ==================== DATE FORMATS ====================
export const DATE_FORMATS = {
  DATE_ONLY: 'YYYY-MM-DD',
  MONTH_ONLY: 'YYYY-MM',
  DATETIME: 'YYYY-MM-DDTHH:mm:ss.sssZ',
} as const;

// ==================== TYPE EXPORTS ====================
export type HttpStatus = typeof HTTP_STATUS[keyof typeof HTTP_STATUS];
export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
export type SuccessMessage = typeof SUCCESS_MESSAGES[keyof typeof SUCCESS_MESSAGES];
