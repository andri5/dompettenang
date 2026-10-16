import { api } from './api';

export type CategoryBudgetStatus = {
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
};

export type BudgetStatus = {
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
};

export type SaveBudgetInput = {
  month: string;
  totalBudget: number;
  categoryBudgets?: { categoryId: string; amount: number }[];
};

export async function getBudgetStatus(month?: string): Promise<BudgetStatus> {
  const params = month ? `?month=${encodeURIComponent(month)}` : '';
  const { data } = await api.get(`/budgets${params}`);
  return data.data as BudgetStatus;
}

export async function saveBudget(input: SaveBudgetInput): Promise<BudgetStatus> {
  const { data } = await api.put('/budgets', input);
  return data.data as BudgetStatus;
}

export async function deleteBudget(month: string): Promise<void> {
  await api.delete(`/budgets/${month}`);
}

export function currentBudgetMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}
