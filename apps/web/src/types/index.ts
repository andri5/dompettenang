/**
 * Dompet Tenang - Type Definitions
 */

export type TransactionType = 'EXPENSE' | 'INCOME';

export type Gender = 'MALE' | 'FEMALE';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
  currency?: string;
  gender?: Gender | null;
  birthDate?: string | null;
  role?: 'USER' | 'ADMIN';
  /** Stored plan from API (FREE/PRO). Prefer hasPro for feature gates. */
  plan?: 'FREE' | 'PRO';
  proExpiresAt?: string | null;
  /** Effective Pro access (admin always true). */
  hasPro?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  captchaToken?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  gender: Gender;
  birthDate: string;
  captchaToken?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
  userId?: string;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
  expenseCount?: number;
}

export interface CreateCategoryData {
  name: string;
  icon?: string;
  color?: string;
  type?: TransactionType;
}

export interface UpdateCategoryData {
  name?: string;
  icon?: string;
  color?: string;
  type?: TransactionType;
}

export interface Expense {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  note?: string | null;
  date: string;
  categoryId: string;
  userId?: string;
  category: Category;
  receiptUrl?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateExpenseData {
  amount: number;
  description: string;
  date: string;
  categoryId: string;
  type?: TransactionType;
  receiptUrl?: string | null;
}

export interface UpdateExpenseData {
  amount?: number;
  description?: string;
  date?: string;
  categoryId?: string;
  type?: TransactionType;
  receiptUrl?: string | null;
}

export interface ExpenseFilters {
  page?: number;
  limit?: number;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  type?: TransactionType;
  sortBy?: 'date' | 'amount' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface DashboardSummary {
  period: 'week' | 'month' | 'year';
  periodStart: string;
  periodEnd: string;
  totalExpenses: number;
  expenseCount: number;
  totalIncome: number;
  incomeCount: number;
  balance: number;
  categoryBreakdown: CategoryBreakdown[];
  expenseCategoryBreakdown?: CategoryBreakdown[];
  incomeCategoryBreakdown?: CategoryBreakdown[];
  overview?: OverviewPoint[];
  recentExpenses?: Expense[];
  recentIncomes?: Expense[];
}

export interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  total: number;
  count: number;
  percentage: number;
}

export interface OverviewPoint {
  name: string;
  income: number;
  expense: number;
  balance: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiError {
  success: false;
  error: string;
  message: string;
  statusCode: number;
}

export interface CategoryBudgetStatus {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  budgetAmount: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  isNearLimit: boolean;
  isOverLimit: boolean;
}

export interface BudgetStatus {
  id: string | null;
  month: string;
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  percentUsed: number;
  isNearLimit: boolean;
  isOverLimit: boolean;
  hasBudget: boolean;
  categoryBudgets: CategoryBudgetStatus[];
}

export interface SaveBudgetData {
  month: string;
  totalBudget: number;
  categoryBudgets?: { categoryId: string; amount: number }[];
}
