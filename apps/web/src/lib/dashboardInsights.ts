/**
 * Smart financial insights for the dashboard
 */

import type { CategoryBreakdown, DashboardSummary } from '@/types';
import { formatCurrency } from '@/lib/utils';

export type InsightTone = 'warning' | 'success' | 'info' | 'caution';

export interface DashboardInsight {
  id: string;
  tone: InsightTone;
  title: string;
  message: string;
  tip?: string;
}

const periodLabel: Record<'week' | 'month' | 'year', string> = {
  week: 'minggu ini',
  month: 'bulan ini',
  year: 'tahun ini',
};

function topCategory(items: CategoryBreakdown[] = []) {
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
    | 'incomeCategoryBreakdown'
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
        'Belum ada data pemasukan atau pengeluaran. Catat beberapa transaksi agar AI bisa memberi saran yang relevan.',
      tip: 'Tambah pemasukan dan pengeluaran harian untuk melihat insight otomatis.',
    });
    return insights;
  }

  if (income === 0 && expense > 0) {
    insights.push({
      id: 'no-income',
      tone: 'warning',
      title: 'Pemasukan belum tercatat',
      message: `Pengeluaran ${period} sudah ${formatCurrency(expense)}, tapi pemasukan masih Rp 0. Saldo terlihat defisit karena sumber uang belum dicatat.`,
      tip: 'Catat gaji, freelance, atau pemasukan lain agar perbandingan lebih akurat.',
    });
  } else if (expense === 0 && income > 0) {
    insights.push({
      id: 'no-expense',
      tone: 'success',
      title: 'Belum ada pengeluaran',
      message: `Pemasukan ${period} ${formatCurrency(income)} dan belum ada pengeluaran tercatat. Ini kesempatan bagus untuk menyisihkan tabungan.`,
      tip: 'Tetap catat pengeluaran kecil agar laporan tetap jujur.',
    });
  } else if (balance < 0) {
    const overspend = Math.abs(balance);
    const ratio = income > 0 ? Math.round((expense / income) * 100) : 100;
    insights.push({
      id: 'deficit',
      tone: 'warning',
      title: 'Pengeluaran melebihi pemasukan',
      message: `Notice: pengeluaran ${period} (${formatCurrency(expense)}) lebih besar dari pemasukan (${formatCurrency(income)}). Defisit ${formatCurrency(overspend)}${income > 0 ? ` — sekitar ${ratio}% dari pemasukan terpakai` : ''}.`,
      tip: topExpense
        ? `Fokus kurangi kategori “${topExpense.categoryName}” (terbesar: ${formatCurrency(topExpense.total)}). Tinjau ulang belanja non-esensial minggu ini.`
        : 'Prioritaskan kebutuhan pokok, tunda belanja sekunder, dan review ulang anggaran harian.',
    });
  } else if (balance === 0 && income > 0) {
    insights.push({
      id: 'break-even',
      tone: 'caution',
      title: 'Saldo pas-pasan',
      message: `Pemasukan dan pengeluaran ${period} seimbang di ${formatCurrency(income)}. Tidak ada sisa untuk tabungan atau dana darurat.`,
      tip: 'Coba sisihkan minimal 10% pemasukan sebelum belanja, agar ada buffer.',
    });
  } else if (income > 0 && expense / income >= 0.85) {
    const remaining = balance;
    const ratio = Math.round((expense / income) * 100);
    insights.push({
      id: 'tight',
      tone: 'caution',
      title: 'Pengeluaran hampir menyamai pemasukan',
      message: `Hampir notice: ${ratio}% pemasukan ${period} sudah terpakai. Sisa hanya ${formatCurrency(remaining)}. Sedikit lonjakan belanja bisa membuat defisit.`,
      tip: topExpense
        ? `Pantau “${topExpense.categoryName}” yang menyumbang ${topExpense.percentage}% pengeluaran.`
        : 'Pertahankan batas belanja harian dan hindari pembelian impulsif.',
    });
  } else if (balance > 0) {
    const savingsRate = income > 0 ? Math.round((balance / income) * 100) : 100;
    insights.push({
      id: 'surplus',
      tone: 'success',
      title: 'Pemasukan melebihi pengeluaran',
      message: `Bagus: pemasukan ${period} (${formatCurrency(income)}) lebih besar dari pengeluaran (${formatCurrency(expense)}). Surplus ${formatCurrency(balance)} (~${savingsRate}% dari pemasukan).`,
      tip:
        savingsRate >= 30
          ? 'Keren! Alokasikan surplus ke tabungan, investasi, atau dana darurat agar kebiasaan baik ini bertahan.'
          : 'Bagus bagus. Coba naikkan target sisa ke 20–30% pemasukan untuk keamanan finansial.',
    });
  }

  if (topExpense && expense > 0 && topExpense.percentage >= 40) {
    insights.push({
      id: 'category-heavy',
      tone: 'info',
      title: `Dominasi kategori ${topExpense.categoryName}`,
      message: `AI notice: “${topExpense.categoryName}” memakai ${topExpense.percentage}% total pengeluaran (${formatCurrency(topExpense.total)} dari ${formatCurrency(expense)}).`,
      tip: 'Cek apakah proporsi ini masih sesuai prioritasmu. Diversifikasi anggaran bisa menekan risiko overspend.',
    });
  }

  if (insights.length === 1 && insights[0].id === 'surplus' && (summary.expenseCount || 0) >= 3) {
    insights.push({
      id: 'habit',
      tone: 'info',
      title: 'Saran kebiasaan baik',
      message:
        'Pola catat transaksimu sudah aktif. Insight akan makin akurat jika semua pemasukan dan pengeluaran terus dicatat konsisten.',
      tip: 'Upload struk di transaksi besar supaya riwayat mudah diaudit nanti.',
    });
  }

  return insights.slice(0, 3);
}
