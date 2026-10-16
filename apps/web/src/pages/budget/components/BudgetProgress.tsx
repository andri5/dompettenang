/**
 * Progress bar for budget tracking
 */

import { cn } from '@/lib/utils';

type BudgetProgressProps = {
  percent: number;
  nearLimit?: boolean;
  overLimit?: boolean;
  size?: 'sm' | 'md';
};

export function BudgetProgress({
  percent,
  nearLimit,
  overLimit,
  size = 'md',
}: BudgetProgressProps) {
  const clamped = Math.min(Math.max(percent, 0), 100);
  const barColor = overLimit
    ? 'bg-danger'
    : nearLimit
      ? 'bg-warning'
      : 'bg-primary';

  return (
    <div
      className={cn(
        'w-full overflow-hidden rounded-full bg-mist-deep',
        size === 'sm' ? 'h-2' : 'h-3'
      )}
    >
      <div
        className={cn('h-full rounded-full transition-all duration-500', barColor)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
