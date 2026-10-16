/**
 * Dompet Tenang - Expense / Income Service
 */

import api from '@/lib/api';
import type {
  ApiResponse,
  CreateExpenseData,
  Expense,
  ExpenseFilters,
  PaginatedResponse,
  UpdateExpenseData,
} from '@/types';

function normalizeExpense(raw: any): Expense {
  return {
    id: raw.id,
    type: raw.type || 'EXPENSE',
    amount: Number(raw.amount),
    description: raw.description || raw.note || '',
    note: raw.note,
    date: raw.date,
    categoryId: raw.categoryId || raw.category?.id,
    category: {
      id: raw.category?.id,
      name: raw.category?.name,
      icon: raw.category?.icon,
      color: raw.category?.color,
      type: raw.category?.type || raw.type || 'EXPENSE',
    },
    receiptUrl: raw.receiptUrl ?? null,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

function toApiPayload(data: CreateExpenseData | UpdateExpenseData) {
  return {
    amount: data.amount,
    categoryId: data.categoryId,
    date: data.date ? data.date.slice(0, 10) : undefined,
    description: data.description,
    note: data.description,
    type: data.type,
    receiptUrl: data.receiptUrl ?? null,
  };
}

export async function getExpenses(
  filters?: ExpenseFilters
): Promise<PaginatedResponse<Expense>> {
  const params = new URLSearchParams();

  if (filters) {
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.categoryId) params.append('categoryId', filters.categoryId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.type) params.append('type', filters.type);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
  }

  const response = await api.get<ApiResponse<any[]>>(
    `/expenses?${params.toString()}`
  );

  const meta = response.data.meta || {
    page: filters?.page || 1,
    limit: filters?.limit || 10,
    total: Array.isArray(response.data.data) ? response.data.data.length : 0,
    totalPages: 1,
  };

  return {
    success: true,
    data: (response.data.data || []).map(normalizeExpense),
    pagination: {
      page: meta.page,
      limit: meta.limit,
      totalItems: meta.total,
      totalPages: meta.totalPages,
      hasNext: meta.page < meta.totalPages,
      hasPrev: meta.page > 1,
    },
  };
}

export async function getExpense(id: string): Promise<Expense> {
  const response = await api.get<ApiResponse<any>>(`/expenses/${id}`);
  return normalizeExpense(response.data.data);
}

export async function createExpense(data: CreateExpenseData): Promise<Expense> {
  const response = await api.post<ApiResponse<any>>(
    '/expenses',
    toApiPayload({ ...data, type: data.type || 'EXPENSE' })
  );
  return normalizeExpense(response.data.data);
}

export async function updateExpense(
  id: string,
  data: UpdateExpenseData
): Promise<Expense> {
  const response = await api.put<ApiResponse<any>>(
    `/expenses/${id}`,
    toApiPayload(data)
  );
  return normalizeExpense(response.data.data);
}

export async function deleteExpense(id: string): Promise<void> {
  await api.delete(`/expenses/${id}`);
}
