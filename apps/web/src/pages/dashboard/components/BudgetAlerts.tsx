/**
 * Pro dashboard banner when the monthly budget, or a category budget, hits 80% or 100%.
 * A browser notification is sent once per threshold per month when permission is already granted.
 */

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Bell } from 'lucide-react';
import { useAuthStore } from '@/stores';
import { useBudget } from '@/hooks/useBudget';
import { hasProAccess } from '@/lib/plan';
import { formatCurrency, cn } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import {
  budgetAlertMessage,
  budgetAlertStorageKey,
  collectBudgetAlerts,
} from '@/lib/budgetAlerts';

const VISIBLE_LIMIT = 4;

function notificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof Notification === 'undefined') return 'unsupported';
  return Notification.permission;
}

export function BudgetAlerts() {
  const user = useAuthStore((s) => s.user);
  const isPro = hasProAccess(user);
  const { budget } = useBudget();
  const [permission, setPermission] = useState(notificationPermission);

  const alerts = useMemo(() => {
    if (!budget?.hasBudget) return [];
    return collectBudgetAlerts({
      totalSpent: budget.totalSpent,
      totalBudget: budget.totalBudget,
      categories: budget.categoryBudgets,
    });
  }, [budget]);

  const month = budget?.month;

  useEffect(() => {
    if (!isPro || !user?.id || !month || alerts.length === 0) return;
    if (permission !== 'granted') return;

    const pending = alerts.filter((alert) => {
      try {
        return localStorage.getItem(budgetAlertStorageKey(user.id, month, alert)) !== '1';
      } catch {
        return false;
      }
    });
    if (pending.length === 0) return;

    try {
      for (const alert of pending) {
        localStorage.setItem(budgetAlertStorageKey(user.id, month, alert), '1');
      }
    } catch {
      return;
    }

    const body =
      pending.length === 1
        ? budgetAlertMessage(pending[0], formatCurrency)
        : `${pending.length} budget bulan ini sudah melewati batas. Buka dashboard untuk detailnya.`;
    new Notification('Dompet Tenang', { body });
  }, [alerts, isPro, month, permission, user?.id]);

  if (!isPro || alerts.length === 0) return null;

  const over = alerts.some((alert) => alert.level === '100');
  const visible = alerts.slice(0, VISIBLE_LIMIT);
  const hiddenCount = alerts.length - visible.length;

  const enable = async () => {
    if (typeof Notification === 'undefined') return;
    const result = await Notification.requestPermission();
    setPermission(result);
  };

  return (
    <div
      className={cn(
        'mb-4 rounded-2xl border px-4 py-3',
        over ? 'border-danger/30 bg-danger-light text-danger' : 'border-warning/30 bg-warning-light text-warning'
      )}
    >
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Peringatan budget</p>
          <ul className="mt-1 space-y-1">
            {visible.map((alert) => (
              <li key={`${alert.id}-${alert.level}`} className="text-sm">
                {budgetAlertMessage(alert, formatCurrency)}
              </li>
            ))}
          </ul>
          {hiddenCount > 0 ? (
            <p className="mt-1 text-xs">Dan {hiddenCount} peringatan lain bulan ini.</p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              to={ROUTES.BUDGET}
              className="inline-flex h-9 items-center rounded-xl bg-ink px-3 text-xs font-semibold text-white"
            >
              Lihat budget
            </Link>
            {permission === 'default' ? (
              <button
                type="button"
                onClick={() => void enable()}
                className="inline-flex h-9 items-center gap-1 rounded-xl border border-current/20 bg-surface px-3 text-xs font-semibold text-ink"
              >
                <Bell className="h-3.5 w-3.5" />
                Ingatkan saya
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
