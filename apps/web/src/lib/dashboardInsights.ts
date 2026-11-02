/**
 * One short dashboard notice for free users. Pro accounts see monthly insight instead.
 */

import type { DashboardSummary } from '@/types';
import { formatCurrency } from '@/lib/utils';

export type InsightTone = 'warning' | 'success' | 'info' | 'caution';

export interface DashboardInsight {
  id: string;
  tone: InsightTone;
  title: string;
  message: string;
}

const periodLabel: Record<'week' | 'month' | 'year', string> = {
  week: 'minggu ini',
  month: 'bulan ini',
  year: 'tahun ini',
};

export function buildDashboardInsights(
  summary: Pick<
    DashboardSummary,
    'period' | 'totalIncome' | 'totalExpenses' | 'balance' | 'incomeCount' | 'expenseCount'
  >
): DashboardInsight[] {
  const period = periodLabel[summary.period] || 'periode ini';
  const income = summary.totalIncome || 0;
  const expense = summary.totalExpenses || 0;
  const balance = summary.balance ?? income - expense;
  const hasAnyData =
    income > 0 || expense > 0 || (summary.incomeCount || 0) > 0 || (summary.expenseCount || 0) > 0;

  if (!hasAnyData) {
    return [
      {
        id: 'empty',
        tone: 'info',
        title: 'Mulai catat transaksi',
        message: 'Belum ada pemasukan atau pengeluaran pada periode ini.',
      },
    ];
  }

  if (income === 0 && expense > 0) {
    return [
      {
        id: 'no-income',
        tone: 'warning',
        title: 'Pemasukan belum tercatat',
        message: `Pengeluaran ${period} ${formatCurrency(expense)}. Pemasukan masih kosong.`,
      },
    ];
  }

  if (expense === 0 && income > 0) {
    return [
      {
        id: 'no-expense',
        tone: 'success',
        title: 'Belum ada pengeluaran',
        message: `Pemasukan ${period} ${formatCurrency(income)}. Pengeluaran belum tercatat.`,
      },
    ];
  }

  if (balance < 0) {
    return [
      {
        id: 'deficit',
        tone: 'warning',
        title: 'Pengeluaran melebihi pemasukan',
        message: `Pengeluaran ${period} ${formatCurrency(expense)}, pemasukan ${formatCurrency(income)}.`,
      },
    ];
  }

  if (balance === 0 && income > 0) {
    return [
      {
        id: 'break-even',
        tone: 'caution',
        title: 'Tidak ada sisa',
        message: `Pemasukan dan pengeluaran ${period} sama, ${formatCurrency(income)}.`,
      },
    ];
  }

  if (income > 0 && expense / income >= 0.85) {
    return [
      {
        id: 'tight',
        tone: 'caution',
        title: 'Sisa tinggal sedikit',
        message: `Pengeluaran ${period} sudah ${Math.round((expense / income) * 100)}% dari pemasukan. Sisa ${formatCurrency(balance)}.`,
      },
    ];
  }

  if (balance > 0) {
    return [
      {
        id: 'surplus',
        tone: 'success',
        title: 'Masih ada sisa',
        message: `Pemasukan ${period} ${formatCurrency(income)}, pengeluaran ${formatCurrency(expense)}. Sisa ${formatCurrency(balance)}.`,
      },
    ];
  }

  return [];
}
