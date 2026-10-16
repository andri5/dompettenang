import api from '@/lib/api';
import type { ApiResponse } from '@/types';

export type RecurringFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export type RecurringTransaction = {
  id: string;
  type: 'EXPENSE' | 'INCOME';
  amount: number;
  note?: string | null;
  frequency: RecurringFrequency;
  startDate: string;
  endDate?: string | null;
  nextRunDate: string;
  isActive: boolean;
  category: {
    id: string;
    name: string;
    icon: string;
    color: string;
    type: 'EXPENSE' | 'INCOME';
  };
};

export type CreateRecurringData = {
  categoryId: string;
  type?: 'EXPENSE' | 'INCOME';
  amount: number;
  note?: string;
  frequency: RecurringFrequency;
  startDate: string;
  endDate?: string;
};

export async function getRecurringTransactions(): Promise<RecurringTransaction[]> {
  const response = await api.get<ApiResponse<RecurringTransaction[]>>('/recurring');
  return response.data.data;
}

export async function createRecurringTransaction(
  data: CreateRecurringData
): Promise<RecurringTransaction> {
  const response = await api.post<ApiResponse<RecurringTransaction>>('/recurring', data);
  return response.data.data;
}

export async function setRecurringActive(id: string, isActive: boolean): Promise<void> {
  await api.patch(`/recurring/${id}/active`, { isActive });
}

export async function runRecurringDue(): Promise<{ created: number; checked: number }> {
  const response = await api.post('/recurring/run');
  return response.data.data as { created: number; checked: number };
}
