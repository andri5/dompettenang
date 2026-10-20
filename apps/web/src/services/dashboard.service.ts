/**
 * Dompet Tenang - Dashboard Service
 * API calls for dashboard data
 */

import api from '@/lib/api';
import type { ApiResponse, DashboardSummary } from '@/types';

export interface DashboardFilters {
  startDate?: string;
  endDate?: string;
  period?: 'week' | 'month' | 'year';
}

/**
 * Get dashboard summary
 */
export async function getDashboardSummary(
  filters?: DashboardFilters
): Promise<DashboardSummary> {
  const params = new URLSearchParams();

  if (filters) {
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.period) params.append('period', filters.period);
  }

  const response = await api.get<ApiResponse<DashboardSummary>>(
    `/dashboard/summary?${params.toString()}`
  );
  return response.data.data;
}

export interface MonthlyInsightHighlight {
  id: string;
  tone: 'warning' | 'success' | 'info' | 'caution';
  title: string;
  message: string;
  tip?: string;
}

export interface MonthlyInsight {
  monthLabel: string;
  previousMonthLabel: string;
  comparedThroughDay: number;
  current: { income: number; expense: number; balance: number; expenseCount: number };
  previous: { income: number; expense: number; balance: number; expenseCount: number };
  incomeChangePct: number | null;
  expenseChangePct: number | null;
  topCategory: { name: string; total: number; percentage: number } | null;
  highlights: MonthlyInsightHighlight[];
}

export async function getMonthlyInsight(): Promise<MonthlyInsight> {
  const response = await api.get<ApiResponse<MonthlyInsight>>('/dashboard/monthly-insight');
  return response.data.data;
}
