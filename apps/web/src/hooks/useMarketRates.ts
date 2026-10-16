/**
 * Fetch USD/IDR + gold quotes for the dashboard
 */

import { useQuery } from '@tanstack/react-query';
import { getMarketQuotes } from '@/services/market.service';

export function useMarketRates() {
  return useQuery({
    queryKey: ['market', 'quotes'],
    queryFn: getMarketQuotes,
    staleTime: 15 * 60 * 1000,
    refetchInterval: 30 * 60 * 1000,
    retry: 1,
  });
}
