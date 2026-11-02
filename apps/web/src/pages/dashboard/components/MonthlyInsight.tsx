/**
 * Pro monthly insight: one sentence, this month's spending, and the top category.
 */

import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Crown, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui';
import { useAuthStore } from '@/stores';
import { hasProAccess } from '@/lib/plan';
import { formatCurrency } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import { getMonthlyInsight } from '@/services/dashboard.service';
import { CollapsibleSection } from './CollapsibleSection';

function summarySentence(pct: number | null, current: number, previous: number) {
  if (current === 0 && previous === 0) {
    return 'Belum ada pengeluaran untuk dibandingkan.';
  }
  if (pct === null) {
    return 'Pengeluaran bulan ini mulai tercatat. Bulan lalu belum ada di periode yang sama.';
  }
  if (pct === 0) {
    return 'Pengeluaran stabil dibanding periode yang sama bulan lalu.';
  }
  if (pct > 0) {
    return `Pengeluaran naik ${pct}% dibanding periode yang sama bulan lalu.`;
  }
  return `Pengeluaran turun ${Math.abs(pct)}% dibanding periode yang sama bulan lalu.`;
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
                Pengeluaran bulan ini dibanding periode yang sama bulan lalu, plus kategori terbesar.
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

  const sentence = summarySentence(
    data.expenseChangePct,
    data.current.expense,
    data.previous.expense
  );

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
          Sampai tanggal {data.comparedThroughDay}
        </p>
      }
    >
      <p className="text-sm font-semibold text-ink">{sentence}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-xs font-medium text-muted">Pengeluaran</p>
          <p className="mt-1 font-display text-xl font-bold text-ink">
            {formatCurrency(data.current.expense)}
          </p>
          <p className="mt-1 text-xs text-muted">
            Bulan lalu {formatCurrency(data.previous.expense)}
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-xs font-medium text-muted">Kategori terbesar</p>
          {data.topCategory ? (
            <>
              <p className="mt-1 font-display text-xl font-bold text-ink">{data.topCategory.name}</p>
              <p className="mt-1 text-xs text-muted">{data.topCategory.percentage}% pengeluaran</p>
            </>
          ) : (
            <p className="mt-1 text-sm text-muted">Belum ada</p>
          )}
        </div>
      </div>
    </CollapsibleSection>
  );
}
