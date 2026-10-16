import api from '@/lib/api';
import type { ApiResponse, BudgetStatus, SaveBudgetData } from '@/types';

export async function getBudgetStatus(month?: string): Promise<BudgetStatus> {
  const params = month ? `?month=${encodeURIComponent(month)}` : '';
  const response = await api.get<ApiResponse<BudgetStatus>>(`/budgets${params}`);
  return response.data.data;
}

export async function saveBudget(data: SaveBudgetData): Promise<BudgetStatus> {
  const response = await api.put<ApiResponse<BudgetStatus>>('/budgets', data);
  return response.data.data;
}

export async function deleteBudget(month: string): Promise<void> {
  await api.delete(`/budgets/${month}`);
}
