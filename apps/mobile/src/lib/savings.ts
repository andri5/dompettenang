import { apiClient } from './api';

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
  const res = await apiClient.get('/savings');
  return res.data?.data || [];
}

export async function createSavingsGoal(input: {
  name: string;
  targetAmount: number;
  deadline?: string | null;
}): Promise<SavingsGoal> {
  const res = await apiClient.post('/savings', input);
  return res.data?.data;
}

export async function addSavingsAmount(goalId: string, amount: number): Promise<SavingsGoal> {
  const res = await apiClient.patch(`/savings/${goalId}/add`, { amount });
  return res.data?.data;
}

export async function updateSavingsGoal(
  goalId: string,
  input: Partial<{
    name: string;
    targetAmount: number;
    deadline: string | null;
  }>
): Promise<SavingsGoal> {
  const res = await apiClient.put(`/savings/${goalId}`, input);
  return res.data?.data;
}

export async function deleteSavingsGoal(goalId: string): Promise<void> {
  await apiClient.delete(`/savings/${goalId}`);
}
