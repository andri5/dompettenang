import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Flag } from 'lucide-react';
import api from '@/lib/api';
import { Card } from '@/components/ui';
import { useToast } from '@/hooks/useToast';
import type { FeatureFlag } from '@/hooks/useFeatureFlags';
import { cn } from '@/lib/utils';

export function AdminFlags() {
  const toast = useToast();
  const qc = useQueryClient();

  const { data: flags = [], isLoading } = useQuery({
    queryKey: ['admin', 'feature-flags'],
    queryFn: async () => {
      const res = await api.get('/admin/feature-flags');
      return res.data.data as FeatureFlag[];
    },
  });

  const toggleMut = useMutation({
    mutationFn: async ({ key, isEnabled }: { key: string; isEnabled: boolean }) => {
      await api.patch(`/admin/feature-flags/${key}`, { isEnabled });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'feature-flags'] });
      qc.invalidateQueries({ queryKey: ['feature-flags'] });
      toast.success('Feature flag diperbarui');
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      toast.error(err?.response?.data?.message || 'Gagal update flag'),
  });

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl font-extrabold text-ink">Feature Flags</h1>
      <p className="mb-6 text-sm text-muted">Nyalakan atau matikan fitur tanpa deploy ulang.</p>

      {isLoading ? (
        <p className="text-muted">Memuat...</p>
      ) : (
        <div className="space-y-3">
          {flags.map((flag) => (
            <Card key={flag.key} padding="md">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                    <Flag className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-ink">{flag.label}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-muted">{flag.key}</p>
                    {flag.description && (
                      <p className="mt-1 text-sm text-muted">{flag.description}</p>
                    )}
                    {flag.key === 'captcha_auth' && (
                      <p className="mt-1 text-xs text-muted">
                        Butuh <span className="font-mono">TURNSTILE_SITE_KEY</span> &{' '}
                        <span className="font-mono">TURNSTILE_SECRET_KEY</span> di API. Berlaku di
                        Login, Register & Lupa Password (web + mobile).
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={flag.isEnabled}
                  disabled={toggleMut.isPending}
                  onClick={() => toggleMut.mutate({ key: flag.key, isEnabled: !flag.isEnabled })}
                  className={cn(
                    'relative h-7 w-12 shrink-0 rounded-full transition',
                    flag.isEnabled ? 'bg-violet-600' : 'bg-mist-deep'
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition',
                      flag.isEnabled ? 'left-5.5 translate-x-0' : 'left-0.5'
                    )}
                    style={{ left: flag.isEnabled ? '1.35rem' : '0.15rem' }}
                  />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
