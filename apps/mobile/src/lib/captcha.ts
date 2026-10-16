/**
 * Fetch public captcha config from API (feature flag + site key)
 */

import { useCallback, useEffect, useState } from 'react';
import { api } from './api';

export type CaptchaPublicConfig = {
  enabled: boolean;
  provider: 'turnstile';
  siteKey: string | null;
  misconfigured: boolean;
};

export function useCaptchaConfig() {
  const [config, setConfig] = useState<CaptchaPublicConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/auth/captcha-config');
      setConfig(data.data as CaptchaPublicConfig);
    } catch {
      setConfig(null);
      setError('Tidak dapat memuat konfigurasi captcha');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const required = Boolean(config?.enabled && config.siteKey);

  return { config, loading, error, required, refresh };
}
