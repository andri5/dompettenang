/**
 * One short notice for free accounts. Pro accounts use monthly insight instead.
 */

import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, CheckCircle2, Info } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import {
  buildDashboardInsights,
  type DashboardInsight,
  type InsightTone,
} from '@/lib/dashboardInsights';
import { useAuthStore } from '@/stores';
import { hasProAccess } from '@/lib/plan';
import type { DashboardSummary } from '@/types';
import { CollapsibleSection } from './CollapsibleSection';

const toneStyles: Record<
  InsightTone,
  { card: string; badge: string; icon: typeof Info; iconWrap: string }
> = {
  warning: {
    card: 'border-coral/30 bg-gradient-to-br from-coral-soft/80 to-surface',
    badge: 'bg-coral text-white',
    icon: AlertTriangle,
    iconWrap: 'bg-coral-soft text-coral',
  },
  caution: {
    card: 'border-amber/30 bg-gradient-to-br from-amber-soft/80 to-surface',
    badge: 'bg-amber text-white',
    icon: AlertTriangle,
    iconWrap: 'bg-amber-soft text-amber',
  },
  success: {
    card: 'border-lime/40 bg-gradient-to-br from-lime-soft/70 to-surface',
    badge: 'bg-lime text-white',
    icon: CheckCircle2,
    iconWrap: 'bg-lime-soft text-lime',
  },
  info: {
    card: 'border-accent/25 bg-gradient-to-br from-accent-soft/70 to-surface',
    badge: 'bg-accent text-white',
    icon: Info,
    iconWrap: 'bg-accent-soft text-accent',
  },
};

function NoticeItem({ insight }: { insight: DashboardInsight }) {
  const style = toneStyles[insight.tone];
  const Icon = style.icon;

  return (
    <div className={cn('rounded-2xl border p-4 shadow-sm', style.card)}>
      <div className="flex items-start gap-3">
        <div className={cn('rounded-xl p-2.5', style.iconWrap)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-sm font-bold text-ink sm:text-base">{insight.title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-ink/80">{insight.message}</p>
        </div>
      </div>
    </div>
  );
}

export function DashboardInsights({
  summary,
}: {
  summary: DashboardSummary | undefined;
}) {
  const isPro = hasProAccess(useAuthStore((s) => s.user));
  if (isPro || !summary) return null;

  const insights = buildDashboardInsights(summary);
  const notice = insights[0];
  if (!notice) return null;

  const showIncomeCta = notice.id === 'no-income' || notice.id === 'empty';
  const showExpenseCta = notice.tone === 'warning' || notice.tone === 'caution';

  return (
    <CollapsibleSection title="Pemberitahuan" defaultOpen>
      <NoticeItem insight={notice} />
      {(showIncomeCta || showExpenseCta) && (
        <div className="mt-4">
          {showIncomeCta ? (
            <Link to={ROUTES.INCOME_NEW} className="inline-flex">
              <Button variant="outline" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Catat Pemasukan
              </Button>
            </Link>
          ) : (
            <Link to={ROUTES.EXPENSES} className="inline-flex">
              <Button variant="ghost" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Lihat Pengeluaran
              </Button>
            </Link>
          )}
        </div>
      )}
    </CollapsibleSection>
  );
}
