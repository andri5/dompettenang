import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export type FeatureFlagKey =
  | 'market_widget'
  | 'savings_goals'
  | 'recurring_transactions'
  | 'feedback_form'
  | 'budget_alerts'
  | 'admin_panel'
  | 'captcha_auth';

export interface FeatureFlag {
  key: FeatureFlagKey | string;
  label: string;
  description?: string | null;
  isEnabled: boolean;
  updatedAt?: string;
}

export function useFeatureFlags() {
  return useQuery({
    queryKey: ['feature-flags'],
    queryFn: async () => {
      const res = await api.get('/feature-flags');
      return (res.data.data ?? []) as FeatureFlag[];
    },
    staleTime: 60_000,
    retry: 1,
  });
}

export function useFeatureEnabled(key: FeatureFlagKey, fallback = true) {
  const { data } = useFeatureFlags();
  if (!data) return fallback;
  const flag = data.find((f) => f.key === key);
  return flag ? flag.isEnabled : fallback;
}
