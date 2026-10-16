import { apiClient } from './api';

export async function getFeedbackStatus(): Promise<boolean> {
  const res = await apiClient.get('/feedback/status');
  return Boolean(res.data?.data?.submitted);
}

export async function submitFeedback(input: {
  name?: string | null;
  message: string;
  rating: number;
}) {
  await apiClient.post('/feedback', input);
}
