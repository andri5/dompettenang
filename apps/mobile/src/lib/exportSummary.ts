import { Share } from 'react-native';
import type { DashboardSummary, Transaction } from './finance';
import { formatIDR, formatDateShort } from './format';

const PERIOD_LABEL = {
  week: 'Minggu',
  month: 'Bulan',
  year: 'Tahun',
} as const;

export function buildSummaryShareText(
  summary: DashboardSummary,
  period: keyof typeof PERIOD_LABEL
): string {
  const lines = [
    `Dompet Tenang — Ringkasan ${PERIOD_LABEL[period]}`,
    `${formatDateShort(summary.periodStart)} – ${formatDateShort(summary.periodEnd)}`,
    '',
    `Pemasukan: ${formatIDR(summary.totalIncome)}`,
    `Pengeluaran: ${formatIDR(summary.totalExpenses)}`,
    `Saldo: ${formatIDR(summary.balance)}`,
  ];

  const breakdown =
    summary.expenseCategoryBreakdown || summary.categoryBreakdown || [];
  if (breakdown.length > 0) {
    lines.push('', 'Top pengeluaran:');
    breakdown.slice(0, 5).forEach((row) => {
      lines.push(`• ${row.categoryName}: ${formatIDR(row.total)}`);
    });
  }

  return lines.join('\n');
}

export async function shareSummaryReport(
  summary: DashboardSummary,
  period: keyof typeof PERIOD_LABEL
): Promise<void> {
  await Share.share({
    message: buildSummaryShareText(summary, period),
    title: 'Ringkasan Dompet Tenang',
  });
}

export async function exportTransactionsCsv(
  transactions: Transaction[],
  summary: DashboardSummary,
  period: keyof typeof PERIOD_LABEL
): Promise<void> {
  const sorted = [...transactions].sort(
    (a, b) => b.date.localeCompare(a.date)
  );

  const lines = [
    `Dompet Tenang — Laporan ${PERIOD_LABEL[period]}`,
    `${summary.periodStart} s/d ${summary.periodEnd}`,
    '',
    `Pemasukan: ${formatIDR(summary.totalIncome)}`,
    `Pengeluaran: ${formatIDR(summary.totalExpenses)}`,
    `Saldo: ${formatIDR(summary.balance)}`,
    '',
    '--- Daftar Transaksi ---',
  ];

  sorted.forEach((tx, i) => {
    const type = tx.type === 'INCOME' ? 'Masuk' : 'Keluar';
    const cat = tx.category?.name || 'Umum';
    const desc = tx.description || tx.note || '-';
    lines.push(
      `${i + 1}. ${tx.date} | ${type} | ${cat} | ${formatIDR(tx.amount)} | ${desc}`
    );
  });

  await Share.share({
    message: lines.join('\n'),
    title: 'Laporan Dompet Tenang',
  });
}
