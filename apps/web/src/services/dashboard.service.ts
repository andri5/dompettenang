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
