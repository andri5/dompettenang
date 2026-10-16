/**
 * Dashboard market rates — USD/IDR, Antam gold, BI Rate, IHSG
 */

import { DollarSign, Gem, Landmark, TrendingUp, RefreshCw, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui';
import { useMarketRates } from '@/hooks/useMarketRates';
import { formatCurrency, cn } from '@/lib/utils';

const SOURCE_LINKS: Record<string, { url: string; name: string }> = {
  usd: { url: 'https://www.bi.go.id/id/statistik/informasi-kurs/transaksi-bi/default.aspx', name: 'Bank Indonesia - Kurs' },
  gold: { url: 'https://www.logammulia.com/id', name: 'Logam Mulia Antam' },
  bi: { url: 'https://www.bi.go.id/id/statistik/indikator/bi-rate.aspx', name: 'Bank Indonesia' },
  ihsg: { url: 'https://www.idx.co.id/id', name: 'IDX Indonesia' },
};

const formatIHSG = (n: number) =>
  new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);

export function MarketRates() {
  const { data, isLoading, isError, isFetching, refetch } = useMarketRates();

  if (isLoading) {
    return (
      <div className="mb-4 animate-pulse rounded-2xl border border-line bg-surface/80 px-3 py-2.5">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="h-8 rounded-xl bg-mist-deep" />
          <div className="h-8 rounded-xl bg-mist-deep" />
          <div className="h-8 rounded-xl bg-mist-deep" />
          <div className="h-8 rounded-xl bg-mist-deep" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mb-4 flex items-center justify-between gap-2 rounded-2xl border border-line bg-surface/80 px-3 py-2">
        <p className="text-[11px] text-muted">Kurs & emas gagal dimuat</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-accent hover:bg-accent-soft"
        >
          <RefreshCw className="h-3 w-3" />
          Coba lagi
        </button>
      </div>
    );
  }

  const items = [
    {
      key: 'usd',
      label: 'USD / IDR',
      value: formatCurrency(data.usdIdr.rate),
      sub: undefined as string | undefined,
      icon: DollarSign,
      tone: 'bg-accent-soft text-accent',
    },
    {
      key: 'gold',
      label: 'Emas 1g',
      value: formatCurrency(data.gold.sellPerGram),
      sub: `BB ${formatCurrency(data.gold.buybackPerGram)}`,
      icon: Gem,
      tone: 'bg-amber-soft text-amber',
    },
    ...(data.biRate
      ? [
          {
            key: 'bi',
            label: 'BI Rate',
            value: data.biRate.percentLabel,
            sub: data.biRate.effectiveDate,
            icon: Landmark,
            tone: 'bg-violet-100 text-violet-700',
          },
        ]
      : []),
    ...(data.ihsg
      ? [
          {
            key: 'ihsg',
            label: 'IHSG',
            value: formatIHSG(data.ihsg.value),
            sub: `${data.ihsg.changePct >= 0 ? '+' : ''}${data.ihsg.changePctLabel}`,
            icon: TrendingUp,
            tone:
              data.ihsg.changePct >= 0
                ? 'bg-lime-100 text-lime-700'
                : 'bg-coral-soft text-coral',
          },
        ]
      : []),
  ];

  const cols = items.length >= 4 ? 'grid-cols-2 sm:grid-cols-4' : items.length === 3 ? 'grid-cols-3' : 'grid-cols-2';

  return (
    <Card padding="none" className="mb-4 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 sm:px-3.5">
        <div className={cn('grid min-w-0 flex-1 gap-2', cols)}>
          {items.map((item) => {
            const source = SOURCE_LINKS[item.key];
            return (
              <a
                key={item.key}
                href={source?.url}
                target="_blank"
                rel="noopener noreferrer"
                title={source ? `Sumber: ${source.name}` : undefined}
                className="group flex min-w-0 items-center gap-2 rounded-xl bg-mist/40 px-2 py-1.5 transition hover:bg-mist/70"
              >
                <span
                  className={cn(
                    'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg transition',
                    item.tone
                  )}
                >
                  <item.icon className="h-3 w-3 transition group-hover:hidden" />
                  <ExternalLink className="hidden h-3 w-3 transition group-hover:block" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-medium leading-none text-muted">{item.label}</p>
                  <p className="mt-0.5 truncate text-xs font-bold tabular text-ink sm:text-[13px]">
                    {item.value}
                  </p>
                  {item.sub ? (
                    <p className="truncate text-[9px] text-muted">{item.sub}</p>
                  ) : null}
                </div>
              </a>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-mist hover:text-ink disabled:opacity-60"
          aria-label="Muat ulang kurs"
          title="Perbarui"
        >
          <RefreshCw className={cn('h-3 w-3', isFetching && 'animate-spin')} />
        </button>
      </div>
    </Card>
  );
}
