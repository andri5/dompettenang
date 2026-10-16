/**
 * Export financial report to Excel / PDF
 */

import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { DashboardSummary, Expense } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

export interface ExportReportInput {
  summary: DashboardSummary;
  transactions: Expense[];
  periodLabel: string;
}

function fileStamp() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

function buildRows(transactions: Expense[]) {
  return [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
    .map((item, index) => ({
      no: index + 1,
      tanggal: formatDate(item.date),
      tipe: item.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran',
      deskripsi: item.description || '-',
      kategori: item.category?.name || 'Umum',
      nominal: item.amount,
      nominalText: formatCurrency(item.amount),
      struk: item.receiptUrl ? 'Ya' : 'Tidak',
    }));
}

export function exportReportToExcel({ summary, transactions, periodLabel }: ExportReportInput) {
  const rows = buildRows(transactions);

  const summarySheet = XLSX.utils.aoa_to_sheet([
    ['Dompet Tenang — Laporan Keuangan'],
    ['Periode', periodLabel],
    ['Rentang', `${summary.periodStart} s/d ${summary.periodEnd}`],
    [],
    ['Ringkasan'],
    ['Total Pemasukan', summary.totalIncome],
    ['Jumlah Transaksi Pemasukan', summary.incomeCount],
    ['Total Pengeluaran', summary.totalExpenses],
    ['Jumlah Transaksi Pengeluaran', summary.expenseCount],
    ['Saldo Bersih', summary.balance],
    [],
    ['Dicetak', new Date().toLocaleString('id-ID')],
  ]);

  summarySheet['!cols'] = [{ wch: 32 }, { wch: 22 }];

  const detailSheet = XLSX.utils.json_to_sheet(
    rows.map((row) => ({
      No: row.no,
      Tanggal: row.tanggal,
      Tipe: row.tipe,
      Deskripsi: row.deskripsi,
      Kategori: row.kategori,
      Nominal: row.nominal,
      Struk: row.struk,
    }))
  );

  detailSheet['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 14 },
    { wch: 36 },
    { wch: 18 },
    { wch: 16 },
    { wch: 8 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan');
  XLSX.utils.book_append_sheet(workbook, detailSheet, 'Transaksi');

  XLSX.writeFile(workbook, `dompet-tenang-laporan-${fileStamp()}.xlsx`);
}

export function exportReportToPdf({ summary, transactions, periodLabel }: ExportReportInput) {
  const rows = buildRows(transactions);
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  doc.setFontSize(16);
  doc.text('Dompet Tenang — Laporan Keuangan', 14, 16);
  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text(`Periode: ${periodLabel} (${summary.periodStart} s/d ${summary.periodEnd})`, 14, 23);
  doc.text(`Dicetak: ${new Date().toLocaleString('id-ID')}`, 14, 29);

  autoTable(doc, {
    startY: 34,
    head: [['Ringkasan', 'Nilai']],
    body: [
      ['Total Pemasukan', formatCurrency(summary.totalIncome)],
      ['Transaksi Pemasukan', String(summary.incomeCount)],
      ['Total Pengeluaran', formatCurrency(summary.totalExpenses)],
      ['Transaksi Pengeluaran', String(summary.expenseCount)],
      ['Saldo Bersih', formatCurrency(summary.balance)],
    ],
    theme: 'grid',
    headStyles: { fillColor: [15, 155, 142] },
    styles: { fontSize: 9 },
    columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 50 } },
  });

  const afterSummaryY =
    (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 70;

  doc.setFontSize(12);
  doc.setTextColor(20);
  doc.text('Daftar Transaksi', 14, afterSummaryY + 10);

  autoTable(doc, {
    startY: afterSummaryY + 14,
    head: [['No', 'Tanggal', 'Tipe', 'Deskripsi', 'Kategori', 'Nominal', 'Struk']],
    body: rows.map((row) => [
      row.no,
      row.tanggal,
      row.tipe,
      row.deskripsi,
      row.kategori,
      row.nominalText,
      row.struk,
    ]),
    theme: 'striped',
    headStyles: { fillColor: [15, 155, 142] },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 12 },
      1: { cellWidth: 28 },
      2: { cellWidth: 28 },
      3: { cellWidth: 70 },
      4: { cellWidth: 36 },
      5: { cellWidth: 36 },
      6: { cellWidth: 18 },
    },
  });

  doc.save(`dompet-tenang-laporan-${fileStamp()}.pdf`);
}
