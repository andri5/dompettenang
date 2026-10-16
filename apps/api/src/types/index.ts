/**
 * Dompet Tenang API - Type Definitions
 */

import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role?: string;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  currency: string;
  gender: 'MALE' | 'FEMALE' | null;
  birthDate: string | null;
  role: string;
  /** Stored subscription plan (FREE/PRO). Admin may still show PRO via hasPro. */
  plan: 'FREE' | 'PRO';
  proExpiresAt: string | null;
  /** Effective Pro access (ADMIN always true, or active PRO plan). */
  hasPro: boolean;
  createdAt: Date;
}

export interface AuthResponse {
  user: UserResponse;
  accessToken: string;
  refreshToken: string;
}

export interface CategoryResponse {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'EXPENSE' | 'INCOME';
  isDefault: boolean;
  expenseCount?: number;
}

export interface ExpenseResponse {
  id: string;
  type: 'EXPENSE' | 'INCOME';
  amount: number;
  category: {
    id: string;
    name: string;
    icon: string;
    color: string;
    type?: 'EXPENSE' | 'INCOME';
  };
  categoryId: string;
  note: string | null;
  description: string;
  date: string;
  receiptUrl: string | null;
  createdAt: Date;
}

export interface CategoryBreakdownItem {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  total: number;
  count: number;
  percentage: number;
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
  /** @deprecated use expenseCategoryBreakdown */
  categoryBreakdown: CategoryBreakdownItem[];
  expenseCategoryBreakdown: CategoryBreakdownItem[];
  incomeCategoryBreakdown: CategoryBreakdownItem[];
  overview: {
    name: string;
    income: number;
    expense: number;
    balance: number;
  }[];
  today: {
    total: number;
    count: number;
  };
  thisWeek: {
    total: number;
    count: number;
  };
  thisMonth: {
    total: number;
    count: number;
  };
  recentExpenses: ExpenseResponse[];
  recentIncomes: ExpenseResponse[];
  topCategories: {
    category: {
      name: string;
      icon: string;
      color: string;
    };
    total: number;
    percentage: number;
  }[];
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
