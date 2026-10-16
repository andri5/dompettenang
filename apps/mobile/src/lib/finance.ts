/**
 * Dashboard / expense / category / market API clients
 */

import { api } from './api';

export type TxType = 'EXPENSE' | 'INCOME';

export type Category = {
  id: string;
  name: string;
  icon?: string | null;
  color?: string | null;
  type: TxType;
};

export type Transaction = {
  id: string;
  type: TxType;
  amount: number;
  description: string;
  note?: string | null;
  date: string;
  categoryId: string;
  category: {
    id?: string;
    name?: string;
    icon?: string | null;
    color?: string | null;
    type?: TxType;
  };
  receiptUrl?: string | null;
};

export type CategoryBreakdownItem = {
  categoryId: string;
  categoryName: string;
  total: number;
  percentage: number;
  color?: string | null;
  categoryColor?: string | null;
};

export type DashboardSummary = {
  period: string;
  periodStart: string;
  periodEnd: string;
  totalExpenses: number;
  totalIncome: number;
  balance: number;
  expenseCount: number;
  incomeCount: number;
  recentExpenses?: Transaction[];
  recentIncomes?: Transaction[];
  categoryBreakdown?: CategoryBreakdownItem[];
  expenseCategoryBreakdown?: CategoryBreakdownItem[];
  topCategories?: CategoryBreakdownItem[];
};

export type MarketQuotes = {
  usdIdr: { rate: number; updatedAt?: string; source?: string };
  gold: {
    sellPerGram: number;
    buybackPerGram?: number;
    label?: string;
    updatedAt?: string;
  };
  ihsg?: {
    value: number;
    change: number;
    changePct: number;
    changePctLabel: string;
    updatedAt?: string;
    source?: string;
  } | null;
  biRate?: {
    rate: number;
    percentLabel: string;
    effectiveDate?: string;
    updatedAt?: string;
    source?: string;
  } | null;
  fetchedAt?: string;
};

export const CATEGORY_COLORS = [
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#84CC16',
  '#F97316',
  '#6366F1',
] as const;

export const CATEGORY_ICONS = [
  'utensils',
  'car',
  'shopping-bag',
  'gamepad-2',
  'heart-pulse',
  'graduation-cap',
  'home',
  'zap',
  'plane',
  'gift',
  'wallet',
  'banknote',
  'briefcase',
  'laptop',
  'line-chart',
  'piggy-bank',
  'sparkles',
  'more-horizontal',
] as const;

function normalizeTx(raw: Record<string, unknown>): Transaction {
  const category = (raw.category as Record<string, unknown>) || {};
  const dateRaw = String(raw.date || '');
  return {
    id: String(raw.id),
    type: (raw.type as TxType) || 'EXPENSE',
    amount: Number(raw.amount),
    description: String(raw.description || raw.note || ''),
    note: (raw.note as string) ?? null,
    date: dateRaw.slice(0, 10),
    categoryId: String(raw.categoryId || category.id || ''),
    category: {
      id: category.id as string | undefined,
      name: category.name as string | undefined,
      icon: (category.icon as string) ?? null,
      color: (category.color as string) ?? null,
      type: (category.type as TxType) || (raw.type as TxType) || 'EXPENSE',
    },
    receiptUrl: (raw.receiptUrl as string) ?? null,
  };
}

export async function getDashboardSummary(
  period: 'week' | 'month' | 'year' = 'month'
): Promise<DashboardSummary> {
  const { data } = await api.get(`/dashboard/summary?period=${period}`);
  return data.data as DashboardSummary;
}

export async function getMarketQuotes(): Promise<MarketQuotes | null> {
  try {
    const { data } = await api.get('/market/quotes');
    return (data.data || null) as MarketQuotes | null;
  } catch {
    return null;
  }
}

export async function getCategories(type?: TxType): Promise<Category[]> {
  const qs = type ? `?type=${type}` : '';
  const { data } = await api.get(`/categories${qs}`);
  return (data.data || []) as Category[];
}

export async function createCategory(input: {
  name: string;
  type: TxType;
  color: string;
  icon: string;
}): Promise<Category> {
  const { data } = await api.post('/categories', input);
  return data.data as Category;
}

export async function updateCategory(
  id: string,
  input: Partial<{ name: string; type: TxType; color: string; icon: string }>
): Promise<Category> {
  const { data } = await api.put(`/categories/${id}`, input);
  return data.data as Category;
}

export async function deleteCategory(id: string): Promise<void> {
  await api.delete(`/categories/${id}`);
}

export async function getTransactions(opts?: {
  page?: number;
  limit?: number;
  type?: TxType;
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  search?: string;
}): Promise<{ items: Transaction[]; total: number; page: number; totalPages: number }> {
  const params = new URLSearchParams();
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;
  params.set('page', String(page));
  params.set('limit', String(limit));
  params.set('sortBy', 'date');
  params.set('sortOrder', 'desc');
  if (opts?.type) params.set('type', opts.type);
  if (opts?.startDate) params.set('startDate', opts.startDate);
  if (opts?.endDate) params.set('endDate', opts.endDate);
  if (opts?.categoryId) params.set('categoryId', opts.categoryId);
  if (opts?.search?.trim()) params.set('search', opts.search.trim());

  const { data } = await api.get(`/expenses?${params.toString()}`);
  const items = ((data.data || []) as Record<string, unknown>[]).map(normalizeTx);
  const total = (data.meta?.total as number) ?? items.length;
  const totalPages =
    (data.meta?.totalPages as number) ?? Math.max(1, Math.ceil(total / limit));
  return { items, total, page, totalPages };
}

export async function getTransaction(id: string): Promise<Transaction> {
  const { data } = await api.get(`/expenses/${id}`);
  return normalizeTx(data.data as Record<string, unknown>);
}

export async function createTransaction(input: {
  amount: number;
  categoryId: string;
  type: TxType;
  date: string;
  description?: string;
  receiptUrl?: string | null;
}): Promise<Transaction> {
  const { data } = await api.post('/expenses', {
    amount: input.amount,
    categoryId: input.categoryId,
    type: input.type,
    date: input.date.slice(0, 10),
    note: input.description || undefined,
    description: input.description || undefined,
    receiptUrl: input.receiptUrl ?? null,
  });
  return normalizeTx(data.data as Record<string, unknown>);
}

export async function updateTransaction(
  id: string,
  input: {
    amount: number;
    categoryId: string;
    type: TxType;
    date: string;
    description?: string;
    receiptUrl?: string | null;
  }
): Promise<Transaction> {
  const { data } = await api.put(`/expenses/${id}`, {
    amount: input.amount,
    categoryId: input.categoryId,
    type: input.type,
    date: input.date.slice(0, 10),
    note: input.description || undefined,
    description: input.description || undefined,
    receiptUrl: input.receiptUrl ?? null,
  });
  return normalizeTx(data.data as Record<string, unknown>);
}

export async function deleteTransaction(id: string): Promise<void> {
  await api.delete(`/expenses/${id}`);
}
