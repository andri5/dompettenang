import { api } from './api';

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

export async function getRecurringTransactions(): Promise<RecurringTransaction[]> {
  const { data } = await api.get('/recurring');
  return (data.data || []) as RecurringTransaction[];
}

export async function createRecurringTransaction(input: {
  categoryId: string;
  amount: number;
  frequency: RecurringFrequency;
  startDate: string;
  note?: string;
  type?: 'EXPENSE' | 'INCOME';
}): Promise<RecurringTransaction> {
  const { data } = await api.post('/recurring', input);
  return data.data as RecurringTransaction;
}

export async function setRecurringActive(id: string, isActive: boolean): Promise<void> {
  await api.patch(`/recurring/${id}/active`, { isActive });
}

export async function runRecurringDue(): Promise<{ created: number; checked: number }> {
  const { data } = await api.post('/recurring/run');
  return data.data as { created: number; checked: number };
}
