/**
 * Public feature flags (mobile) — mirrors web useFeatureFlags
 */

import { useCallback, useEffect, useState } from 'react';
import { api } from './api';

export type FeatureFlagKey =
  | 'market_widget'
  | 'savings_goals'
  | 'recurring_transactions'
  | 'feedback_form'
  | 'budget_alerts'
  | 'admin_panel'
  | 'captcha_auth';

export type FeatureFlag = {
  key: FeatureFlagKey | string;
  label: string;
  description?: string | null;
  isEnabled: boolean;
};

let cachedFlags: FeatureFlag[] | null = null;
let inflight: Promise<FeatureFlag[]> | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

async function loadFlags(force = false): Promise<FeatureFlag[]> {
  if (!force && cachedFlags) return cachedFlags;
  if (!force && inflight) return inflight;

  inflight = (async () => {
    try {
      const { data } = await api.get('/feature-flags');
      cachedFlags = (data.data ?? []) as FeatureFlag[];
    } catch {
      cachedFlags = cachedFlags ?? [];
    } finally {
      inflight = null;
      notify();
    }
    return cachedFlags ?? [];
  })();

  return inflight;
}

export function useFeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlag[]>(cachedFlags ?? []);
  const [loading, setLoading] = useState(!cachedFlags);

  const refresh = useCallback(async () => {
    setLoading(true);
    const next = await loadFlags(true);
    setFlags(next);
    setLoading(false);
  }, []);

  useEffect(() => {
    let mounted = true;
    const sync = () => {
      if (!mounted) return;
      setFlags(cachedFlags ?? []);
      setLoading(false);
    };
    listeners.add(sync);
    void loadFlags().then((next) => {
      if (!mounted) return;
      setFlags(next);
      setLoading(false);
    });
    return () => {
      mounted = false;
      listeners.delete(sync);
    };
  }, []);

  return { flags, loading, refresh };
}

export function useFeatureEnabled(key: FeatureFlagKey, fallback = true) {
  const { flags, loading } = useFeatureFlags();
  if (loading && flags.length === 0) return fallback;
  const flag = flags.find((f) => f.key === key);
  return flag ? flag.isEnabled : fallback;
}
