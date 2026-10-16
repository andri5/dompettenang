import { Link } from 'react-router-dom';
import { AlertTriangle, PiggyBank } from 'lucide-react';
import { Card, CardContent } from '@/components/ui';
import { useBudget } from '@/hooks/useBudget';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import { BudgetProgress } from '@/pages/budget/components/BudgetProgress';

function formatNominal(n: number) {
  return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);
}

export function BudgetSummaryCard() {
  const { budget, isLoading } = useBudget();

  if (isLoading) {
    return (
      <Card className="mb-4">
        <CardContent className="py-4 text-sm text-muted">Memuat budget…</CardContent>
      </Card>
    );
  }

  if (!budget?.hasBudget) {
    return (
      <Card className="mb-4 border-dashed">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <PiggyBank className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold text-ink">Atur budget bulan ini</p>
              <p className="text-sm text-muted">Pantau limit pengeluaran dan dapat peringatan 80%.</p>
            </div>
          </div>
          <Link
            to={ROUTES.BUDGET}
            className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-md shadow-accent/20"
          >
            Kelola budget
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <CardContent className="py-4">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-ink">Budget bulan ini</p>
            <p className="text-xs text-muted">
              {formatNominal(budget.totalSpent)} / {formatNominal(budget.totalBudget)}
            </p>
          </div>
          <Link to={ROUTES.BUDGET} className="text-sm font-semibold text-accent hover:underline">
            Detail
          </Link>
        </div>

        {(budget.isNearLimit || budget.isOverLimit) && (
          <div
            className={cn(
              'mb-3 flex items-start gap-2 rounded-xl px-3 py-2 text-sm',
              budget.isOverLimit ? 'bg-danger-light text-danger' : 'bg-warning-light text-warning'
            )}
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              {budget.isOverLimit
                ? 'Budget total sudah melewati limit!'
                : 'Budget total sudah ≥ 80%.'}
            </p>
          </div>
        )}

        <BudgetProgress
          percent={budget.percentUsed}
          nearLimit={budget.isNearLimit}
          overLimit={budget.isOverLimit}
        />
        <p className="mt-2 text-xs text-muted">
          Sisa {formatNominal(budget.totalRemaining)} · {budget.percentUsed}% terpakai
        </p>
      </CardContent>
    </Card>
  );
}
