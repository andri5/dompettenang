/**
 * Dashboard AI insights / notices
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Info,
  Lightbulb,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import {
  buildDashboardInsights,
  type DashboardInsight,
  type InsightTone,
} from '@/lib/dashboardInsights';
import type { DashboardSummary } from '@/types';
import { CollapsibleSection } from './CollapsibleSection';

const toneStyles: Record<
  InsightTone,
  { card: string; badge: string; icon: typeof Sparkles; iconWrap: string }
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

const toneLabel: Record<InsightTone, string> = {
  warning: 'Perhatian',
  caution: 'Waspada',
  success: 'Bagus',
  info: 'Saran',
};

function InsightItem({ insight, index }: { insight: DashboardInsight; index: number }) {
  const style = toneStyles[insight.tone];
  const Icon = style.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 + index * 0.06 }}
      className={cn('rounded-2xl border p-4 shadow-sm', style.card)}
    >
      <div className="flex items-start gap-3">
        <div className={cn('rounded-xl p-2.5', style.iconWrap)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                style.badge
              )}
            >
              {toneLabel[insight.tone]}
            </span>
            <h3 className="font-display text-sm font-bold text-ink sm:text-base">
              {insight.title}
            </h3>
          </div>
          <p className="text-sm leading-relaxed text-ink/80">{insight.message}</p>
          {insight.tip && (
            <div className="mt-3 flex gap-2 rounded-xl bg-surface/80 px-3 py-2.5 ring-1 ring-line/70">
              <Lightbulb className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" />
              <p className="text-xs leading-relaxed text-muted sm:text-sm">{insight.tip}</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function DashboardInsights({
  summary,
}: {
  summary: DashboardSummary | undefined;
}) {
  if (!summary) return null;

  const insights = buildDashboardInsights(summary);
  if (!insights.length) return null;

  const primary = insights[0];
  const showExpenseCta = primary.tone === 'warning' || primary.tone === 'caution';
  const showIncomeCta = primary.id === 'no-income' || primary.id === 'empty';

  return (
    <CollapsibleSection
      title="AI Saran & Notice"
      defaultOpen
      icon={
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-white">
          <Sparkles className="h-4 w-4" />
        </span>
      }
      headerExtra={
        <p className="mt-0.5 text-xs font-medium text-muted">Berdasarkan data periode ini</p>
      }
    >
      <div className="space-y-3">
        {insights.map((insight, index) => (
          <InsightItem key={insight.id} insight={insight} index={index} />
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        {showIncomeCta && (
          <Link to={ROUTES.INCOME_NEW} className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full"
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Catat Pemasukan
            </Button>
          </Link>
        )}
        {showExpenseCta && (
          <Link to={ROUTES.EXPENSES} className="w-full sm:w-auto">
            <Button
              variant="ghost"
              className="w-full"
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Review Pengeluaran
            </Button>
          </Link>
        )}
        {primary.tone === 'success' && (
          <Link to={ROUTES.INCOME_NEW} className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full"
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Tambah Pemasukan
            </Button>
          </Link>
        )}
      </div>
    </CollapsibleSection>
  );
}
