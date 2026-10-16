/**
 * Dompet Tenang - Dashboard Hooks
 */

import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/constants';
import { getDashboardSummary } from '@/services/dashboard.service';
import type { DashboardFilters } from '@/services/dashboard.service';

/**
 * Hook to fetch dashboard summary
 */
export function useDashboard(filters?: DashboardFilters) {
  const period = filters?.period || 'month';
  
  return useQuery({
    queryKey: QUERY_KEYS.DASHBOARD_SUMMARY(period),
    queryFn: () => getDashboardSummary(filters),
  });
}
