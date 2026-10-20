/**
 * Pro monthly insight: this month-to-date vs the same window last month.
 */

import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Crown, Sparkles, TrendingDown, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui';
import { useAuthStore } from '@/stores';
import { hasProAccess } from '@/lib/plan';
import { formatCurrency, cn } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import { getMonthlyInsight } from '@/services/dashboard.service';
import { CollapsibleSection } from './CollapsibleSection';

function changeLabel(pct: number | null) {
  if (pct === null) return 'baru';
  if (pct === 0) return 'stabil';
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct}%`;
}

export function MonthlyInsight() {
  const user = useAuthStore((s) => s.user);
  const isPro = hasProAccess(user);

  const query = useQuery({
    queryKey: ['dashboard', 'monthly-insight'],
    queryFn: getMonthlyInsight,
    enabled: isPro,
    staleTime: 60_000,
  });

  if (!isPro) {
    return (
      <Card padding="md" className="mb-4 border-accent/20 bg-gradient-to-br from-accent-soft/50 to-surface">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent text-white">
              <Crown className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-base font-bold text-ink">Insight bulanan</p>
              <p className="mt-1 text-sm text-muted">
                Bandingkan pengeluaran bulan ini dengan periode yang sama bulan lalu, plus
                kategori terbesar dan saran singkat. Termasuk Pro Lifetime.
              </p>
            </div>
          </div>
          <Link
            to={ROUTES.UPGRADE}
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-accent px-4 text-sm font-semibold text-white"
          >
            Lihat Pro
          </Link>
        </div>
      </Card>
    );
  }

  const data = query.data;
  if (query.isLoading || !data) {
    return (
      <Card padding="md" className="mb-4">
        <p className="text-sm text-muted">Memuat insight bulanan…</p>
      </Card>
    );
  }

  const expenseUp = (data.expenseChangePct ?? 0) > 0;

  return (
    <CollapsibleSection
      title="Insight bulanan"
      defaultOpen
      icon={
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-white">
          <Sparkles className="h-4 w-4" />
        </span>
      }
      headerExtra={
        <p className="mt-0.5 text-xs font-medium text-muted">
          {data.monthLabel} vs {data.previousMonthLabel} · sampai tanggal {data.comparedThroughDay}
        </p>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-xs font-medium text-muted">Pengeluaran</p>
          <p className="mt-1 font-display text-xl font-bold text-ink">
            {formatCurrency(data.current.expense)}
          </p>
          <p
            className={cn(
              'mt-1 inline-flex items-center gap-1 text-xs font-semibold',
              expenseUp ? 'text-coral' : 'text-lime'
            )}
          >
            {expenseUp ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {changeLabel(data.expenseChangePct)} vs bulan lalu ({formatCurrency(data.previous.expense)})
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-xs font-medium text-muted">Sisa (pemasukan − pengeluaran)</p>
          <p className="mt-1 font-display text-xl font-bold text-ink">
            {formatCurrency(data.current.balance)}
          </p>
          <p className="mt-1 text-xs text-muted">
            Bulan lalu {formatCurrency(data.previous.balance)}
            {data.topCategory ? ` · terbesar: ${data.topCategory.name}` : ''}
          </p>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {data.highlights.map((item) => (
          <div key={item.id} className="rounded-2xl border border-line bg-mist/40 px-4 py-3">
            <p className="text-sm font-semibold text-ink">{item.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">{item.message}</p>
            {item.tip ? <p className="mt-2 text-xs text-accent">{item.tip}</p> : null}
          </div>
        ))}
      </div>
    </CollapsibleSection>
  );
}
