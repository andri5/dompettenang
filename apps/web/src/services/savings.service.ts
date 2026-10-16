import api from '@/lib/api';
import type { ApiResponse } from '@/types';

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  deadline: string | null;
  icon: string;
  color: string;
  isCompleted: boolean;
  percentSaved: number;
  remaining: number;
  createdAt: string;
}

export async function getSavingsGoals(): Promise<SavingsGoal[]> {
  const { data } = await api.get<ApiResponse<SavingsGoal[]>>('/savings');
  return data.data || [];
}

export async function createSavingsGoal(input: {
  name: string;
  targetAmount: number;
  deadline?: string | null;
  icon?: string;
  color?: string;
}): Promise<SavingsGoal> {
  const { data } = await api.post<ApiResponse<SavingsGoal>>('/savings', input);
  return data.data;
}

export async function addSavingsAmount(goalId: string, amount: number): Promise<SavingsGoal> {
  const { data } = await api.patch<ApiResponse<SavingsGoal>>(`/savings/${goalId}/add`, { amount });
  return data.data;
}

export async function updateSavingsGoal(goalId: string, input: Partial<{
  name: string;
  targetAmount: number;
  savedAmount: number;
  deadline: string | null;
  icon: string;
  color: string;
}>): Promise<SavingsGoal> {
  const { data } = await api.put<ApiResponse<SavingsGoal>>(`/savings/${goalId}`, input);
  return data.data;
}

export async function deleteSavingsGoal(goalId: string): Promise<void> {
  await api.delete(`/savings/${goalId}`);
}
