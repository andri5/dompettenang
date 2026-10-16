import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export type CaptchaPublicConfig = {
  enabled: boolean;
  provider: 'turnstile';
  siteKey: string | null;
  misconfigured: boolean;
};

export function useCaptchaConfig() {
  return useQuery({
    queryKey: ['auth', 'captcha-config'],
    queryFn: async () => {
      const res = await api.get('/auth/captcha-config');
      return res.data.data as CaptchaPublicConfig;
    },
    staleTime: 30_000,
    refetchOnMount: 'always',
    retry: 2,
  });
}
