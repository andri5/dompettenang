/**
 * Market quotes service — USD/IDR + gold
 */

import api from '@/lib/api';
import type { ApiResponse } from '@/types';

export interface MarketQuotes {
  usdIdr: {
    rate: number;
    updatedAt: string;
    source: string;
  };
  gold: {
    sellPerGram: number;
    buybackPerGram: number;
    label: string;
    updatedAt: string;
    source: string;
  };
  biRate?: {
    rate: number;
    percentLabel: string;
    effectiveDate?: string;
    updatedAt?: string;
    source?: string;
  } | null;
  ihsg?: {
    value: number;
    change: number;
    changePct: number;
    changePctLabel: string;
    updatedAt: string;
    source: string;
  } | null;
  fetchedAt: string;
}

export async function getMarketQuotes(): Promise<MarketQuotes> {
  const response = await api.get<ApiResponse<MarketQuotes>>('/market/quotes');
  return response.data.data;
}
