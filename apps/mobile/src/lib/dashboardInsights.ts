/**
 * Rule-based dashboard insights (ported from web)
 */

import type { CategoryBreakdownItem, DashboardSummary } from './finance';
import { formatIDR } from './format';
import { neoColors, type ThemeColors } from '../theme';

export type InsightTone = 'warning' | 'success' | 'info' | 'caution';

export type DashboardInsight = {
  id: string;
  tone: InsightTone;
  title: string;
  message: string;
  tip?: string;
};

const periodLabel: Record<string, string> = {
  week: 'minggu ini',
  month: 'bulan ini',
  year: 'tahun ini',
};

function topCategory(items: CategoryBreakdownItem[] = []) {
  return items[0] || null;
}

export function buildDashboardInsights(
  summary: Pick<
    DashboardSummary,
    | 'period'
    | 'totalIncome'
    | 'totalExpenses'
    | 'balance'
    | 'incomeCount'
    | 'expenseCount'
    | 'expenseCategoryBreakdown'
    | 'categoryBreakdown'
  >
): DashboardInsight[] {
  const insights: DashboardInsight[] = [];
  const period = periodLabel[summary.period] || 'periode ini';
  const income = summary.totalIncome || 0;
  const expense = summary.totalExpenses || 0;
  const balance = summary.balance ?? income - expense;
  const expenseCats =
    summary.expenseCategoryBreakdown || summary.categoryBreakdown || [];
  const topExpense = topCategory(expenseCats);

  const hasAnyData =
    income > 0 || expense > 0 || (summary.incomeCount || 0) > 0 || (summary.expenseCount || 0) > 0;

  if (!hasAnyData) {
    insights.push({
      id: 'empty',
      tone: 'info',
      title: 'Mulai catat transaksi',
      message:
        'Belum ada data pemasukan atau pengeluaran. Catat beberapa transaksi agar saran lebih relevan.',
      tip: 'Tambah pemasukan dan pengeluaran harian.',
    });
    return insights;
  }

  if (income === 0 && expense > 0) {
    insights.push({
      id: 'no-income',
      tone: 'warning',
      title: 'Pemasukan belum tercatat',
      message: `Pengeluaran ${period} sudah ${formatIDR(expense)}, tapi pemasukan masih Rp 0.`,
      tip: 'Catat gaji atau pemasukan lain agar perbandingan akurat.',
    });
  } else if (expense === 0 && income > 0) {
    insights.push({
      id: 'no-expense',
      tone: 'success',
      title: 'Belum ada pengeluaran',
      message: `Pemasukan ${period} ${formatIDR(income)} dan belum ada pengeluaran tercatat.`,
    });
  } else if (balance < 0) {
    insights.push({
      id: 'deficit',
      tone: 'warning',
      title: 'Pengeluaran melebihi pemasukan',
      message: `Pengeluaran ${period} (${formatIDR(expense)}) lebih besar dari pemasukan (${formatIDR(income)}).`,
      tip: topExpense
        ? `Fokus kurangi “${topExpense.categoryName}” (${formatIDR(topExpense.total)}).`
        : 'Prioritaskan kebutuhan pokok minggu ini.',
    });
  } else if (income > 0 && expense / income >= 0.85) {
    insights.push({
      id: 'tight',
      tone: 'caution',
      title: 'Pengeluaran hampir menyamai pemasukan',
      message: `Sisa hanya ${formatIDR(balance)}. Sedikit lonjakan belanja bisa membuat defisit.`,
    });
  } else if (balance > 0) {
    const savingsRate = income > 0 ? Math.round((balance / income) * 100) : 100;
    insights.push({
      id: 'surplus',
      tone: 'success',
      title: 'Pemasukan melebihi pengeluaran',
      message: `Surplus ${formatIDR(balance)} (~${savingsRate}% dari pemasukan).`,
      tip: 'Alokasikan surplus ke tabungan atau dana darurat.',
    });
  }

  if (topExpense && expense > 0 && topExpense.percentage >= 40) {
    insights.push({
      id: 'category-heavy',
      tone: 'info',
      title: `Dominasi ${topExpense.categoryName}`,
      message: `“${topExpense.categoryName}” memakai ${topExpense.percentage}% total pengeluaran.`,
    });
  }

  return insights.slice(0, 3);
}

/** Prefer getInsightToneColor(themeColors) in UI; default uses Neo. */
export function getInsightToneColor(c: ThemeColors = neoColors): Record<InsightTone, string> {
  return {
    warning: c.expense,
    success: c.income,
    info: c.brandDark,
    caution: c.amber,
  };
}

export const insightToneColor = getInsightToneColor();
