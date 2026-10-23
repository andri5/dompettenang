/**
 * Free reminder: banner + optional browser notification if today has no transactions.
 */

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { useAuthStore } from '@/stores';
import { getExpenses } from '@/services/expense.service';
import { ROUTES } from '@/lib/constants';

const ENABLED_KEY = 'dt_daily_reminder_enabled';
const SENT_PREFIX = 'dt_daily_reminder_sent_';

function todayYmd() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function reminderEnabled() {
  try {
    return localStorage.getItem(ENABLED_KEY) === '1';
  } catch {
    return false;
  }
}

export function DailyLogReminder() {
  const user = useAuthStore((s) => s.user);
  const ymd = todayYmd();

  const { data } = useQuery({
    queryKey: ['expenses', 'today-any', ymd, user?.id],
    queryFn: () =>
      getExpenses({ startDate: ymd, endDate: ymd, page: 1, limit: 1 }),
    enabled: Boolean(user),
    staleTime: 60_000,
  });

  const empty = Boolean(user) && data != null && data.pagination.totalItems === 0;

  useEffect(() => {
    if (!empty || !reminderEnabled()) return;
    if (new Date().getHours() < 18) return;
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    try {
      if (localStorage.getItem(`${SENT_PREFIX}${ymd}`) === '1') return;
      localStorage.setItem(`${SENT_PREFIX}${ymd}`, '1');
    } catch {
      return;
    }
    new Notification('Dompet Tenang', {
      body: 'Hari ini belum ada catatan pemasukan atau pengeluaran.',
    });
  }, [empty, ymd]);

  if (!empty) return null;

  const enable = async () => {
    if (typeof Notification === 'undefined') return;
    const result = await Notification.requestPermission();
    if (result !== 'granted') return;
    try {
      localStorage.setItem(ENABLED_KEY, '1');
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-amber/30 bg-amber-soft/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-ink">
        Hari ini belum ada catatan. Catat pemasukan atau pengeluaran supaya saldo tetap akurat.
      </p>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Link
          to={ROUTES.EXPENSE_NEW}
          className="inline-flex h-9 items-center rounded-xl bg-accent px-3 text-xs font-semibold text-white"
        >
          Catat sekarang
        </Link>
        <button
          type="button"
          onClick={() => void enable()}
          className="inline-flex h-9 items-center gap-1 rounded-xl border border-line bg-surface px-3 text-xs font-semibold text-ink"
        >
          <Bell className="h-3.5 w-3.5" />
          Ingatkan saya
        </button>
      </div>
    </div>
  );
}
