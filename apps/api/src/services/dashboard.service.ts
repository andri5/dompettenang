import { prisma } from '../utils/prisma.js';
import type { DashboardQueryInput } from '../utils/validation.js';
import type { DashboardSummary } from '../types/index.js';

export class DashboardService {
  async getSummary(userId: string, query: DashboardQueryInput): Promise<DashboardSummary> {
    const { startDate, endDate } = this.resolvePeriod(query);

    const [
      expenseStats,
      incomeStats,
      expenseCategoryBreakdown,
      incomeCategoryBreakdown,
      recentExpenses,
      recentIncomes,
      overview,
    ] = await Promise.all([
      this.getStats(userId, 'EXPENSE', startDate, endDate),
      this.getStats(userId, 'INCOME', startDate, endDate),
      this.getCategoryBreakdown(userId, 'EXPENSE', startDate, endDate),
      this.getCategoryBreakdown(userId, 'INCOME', startDate, endDate),
      this.getRecent(userId, 'EXPENSE', 5),
      this.getRecent(userId, 'INCOME', 5),
      this.getOverviewSeries(userId, query.period, startDate, endDate),
    ]);

    const balance = incomeStats.total - expenseStats.total;

    // Keep legacy fields for older clients
    const today = await this.getStatsForRelative(userId, 'today');
    const thisWeek = await this.getStatsForRelative(userId, 'week');
    const thisMonth = await this.getStatsForRelative(userId, 'month');

    return {
      period: query.period,
      periodStart: startDate.toISOString().split('T')[0],
      periodEnd: endDate.toISOString().split('T')[0],
      totalExpenses: expenseStats.total,
      expenseCount: expenseStats.count,
      totalIncome: incomeStats.total,
      incomeCount: incomeStats.count,
      balance,
      categoryBreakdown: expenseCategoryBreakdown,
      expenseCategoryBreakdown,
      incomeCategoryBreakdown,
      overview,
      today,
      thisWeek,
      thisMonth,
      recentExpenses,
      recentIncomes,
      topCategories: expenseCategoryBreakdown.slice(0, 5).map((item) => ({
        category: {
          name: item.categoryName,
          icon: item.categoryIcon,
          color: item.categoryColor,
        },
        total: item.total,
        percentage: item.percentage,
      })),
    };
  }

  /**
   * Pro: compare this month-to-date with the same day range last month.
   */
  async getMonthlyInsight(userId: string) {
    const now = new Date();
    const current = this.comparableMonthWindow(now, 0);
    const previous = this.comparableMonthWindow(now, -1);

    const [curIncome, curExpense, prevIncome, prevExpense, curCats, prevCats] =
      await Promise.all([
        this.getStats(userId, 'INCOME', current.start, current.end),
        this.getStats(userId, 'EXPENSE', current.start, current.end),
        this.getStats(userId, 'INCOME', previous.start, previous.end),
        this.getStats(userId, 'EXPENSE', previous.start, previous.end),
        this.getCategoryBreakdown(userId, 'EXPENSE', current.start, current.end),
        this.getCategoryBreakdown(userId, 'EXPENSE', previous.start, previous.end),
      ]);

    const currentCats = curCats ?? [];
    const previousCats = prevCats ?? [];
    const currentBalance = curIncome.total - curExpense.total;
    const previousBalance = prevIncome.total - prevExpense.total;
    const top = currentCats[0] || null;
    const prevTop = previousCats[0] || null;
    const prevSame = top
      ? previousCats.find((c) => c.categoryId === top.categoryId) || null
      : null;

    const highlights = buildMonthlyHighlights({
      currentIncome: curIncome.total,
      currentExpense: curExpense.total,
      previousIncome: prevIncome.total,
      previousExpense: prevExpense.total,
      currentBalance,
      previousBalance,
      topName: top?.categoryName || null,
      topTotal: top?.total || 0,
      topPct: top?.percentage || 0,
      prevSameTotal: prevSame?.total ?? null,
      prevTopName: prevTop?.categoryName || null,
    });

    return {
      monthLabel: formatMonthLabel(current.start),
      previousMonthLabel: formatMonthLabel(previous.start),
      comparedThroughDay: current.end.getDate(),
      current: {
        income: curIncome.total,
        expense: curExpense.total,
        balance: currentBalance,
        expenseCount: curExpense.count,
      },
      previous: {
        income: prevIncome.total,
        expense: prevExpense.total,
        balance: previousBalance,
        expenseCount: prevExpense.count,
      },
      incomeChangePct: percentChange(curIncome.total, prevIncome.total),
      expenseChangePct: percentChange(curExpense.total, prevExpense.total),
      topCategory: top
        ? { name: top.categoryName, total: top.total, percentage: top.percentage }
        : null,
      highlights,
    };
  }

  /** Same calendar-day window: this month so far vs last month through the same day. */
  private comparableMonthWindow(now: Date, monthOffset: number) {
    const anchor = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    const year = anchor.getFullYear();
    const month = anchor.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const day = Math.min(now.getDate(), lastDay);
    return {
      start: new Date(year, month, 1, 0, 0, 0, 0),
      end: new Date(year, month, day, 23, 59, 59, 999),
    };
  }

  private resolvePeriod(query: DashboardQueryInput): { startDate: Date; endDate: Date } {
    if (query.startDate && query.endDate) {
      return {
        startDate: new Date(`${query.startDate}T00:00:00.000`),
        endDate: new Date(`${query.endDate}T23:59:59.999`),
      };
    }

    const now = new Date();
    const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    let startDate: Date;

    switch (query.period) {
      case 'week': {
        startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
        break;
      }
      case 'year': {
        startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
        break;
      }
      case 'month':
      default: {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        break;
      }
    }

    return { startDate, endDate };
  }

  private async getStatsForRelative(
    userId: string,
    range: 'today' | 'week' | 'month'
  ): Promise<{ total: number; count: number }> {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    if (range === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (range === 'week') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      startDate.setDate(startDate.getDate() - startDate.getDay());
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    return this.getStats(userId, 'EXPENSE', startDate, endDate);
  }

  private async getStats(
    userId: string,
    type: 'EXPENSE' | 'INCOME',
    startDate: Date,
    endDate: Date
  ): Promise<{ total: number; count: number }> {
    const result = await prisma.expense.aggregate({
      where: {
        userId,
        type,
        deletedAt: null,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: { amount: true },
      _count: { id: true },
    });

    return {
      total: Number(result._sum.amount || 0),
      count: result._count.id,
    };
  }

  private async getRecent(userId: string, type: 'EXPENSE' | 'INCOME', take: number) {
    const rows = await prisma.expense.findMany({
      where: {
        userId,
        type,
        deletedAt: null,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
            type: true,
          },
        },
      },
      orderBy: { date: 'desc' },
      take,
    });

    return rows.map((exp: any) => ({
      id: exp.id,
      type: exp.type,
      amount: Number(exp.amount),
      category: exp.category,
      categoryId: exp.category.id,
      note: exp.note,
      description: exp.note || '',
      date: exp.date.toISOString().split('T')[0],
      receiptUrl: exp.receiptUrl,
      createdAt: exp.createdAt,
    }));
  }

  private async getOverviewSeries(
    userId: string,
    period: 'week' | 'month' | 'year',
    startDate: Date,
    endDate: Date
  ): Promise<DashboardSummary['overview']> {
    const rows = await prisma.expense.findMany({
      where: {
        userId,
        deletedAt: null,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        type: true,
        amount: true,
        date: true,
      },
      orderBy: { date: 'asc' },
    });

    const bucket = new Map<string, { income: number; expense: number }>();

    for (const row of rows) {
      const key = this.getOverviewKey(row.date, period);
      const current = bucket.get(key) || { income: 0, expense: 0 };
      const amount = Number(row.amount);
      if (row.type === 'INCOME') {
        current.income += amount;
      } else {
        current.expense += amount;
      }
      bucket.set(key, current);
    }

    return Array.from(bucket.entries()).map(([name, value]) => ({
      name,
      income: value.income,
      expense: value.expense,
      balance: value.income - value.expense,
    }));
  }

  private getOverviewKey(date: Date, period: 'week' | 'month' | 'year') {
    if (period === 'year') {
      return date.toLocaleDateString('id-ID', { month: 'short' });
    }
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
  }

  private async getCategoryBreakdown(
    userId: string,
    type: 'EXPENSE' | 'INCOME',
    startDate: Date,
    endDate: Date
  ): Promise<DashboardSummary['expenseCategoryBreakdown']> {
    const grouped = await prisma.expense.groupBy({
      by: ['categoryId'],
      where: {
        userId,
        type,
        deletedAt: null,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: { amount: true },
      _count: { id: true },
      orderBy: {
        _sum: { amount: 'desc' },
      },
    });

    const total = grouped.reduce((sum, item) => sum + Number(item._sum.amount || 0), 0);
    const categoryIds = grouped.map((item) => item.categoryId);
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: {
        id: true,
        name: true,
        icon: true,
        color: true,
      },
    });
    const categoryMap = new Map(categories.map((category) => [category.id, category]));

    return grouped.map((item) => {
      const category = categoryMap.get(item.categoryId);
      const amount = Number(item._sum.amount || 0);
      return {
        categoryId: item.categoryId,
        categoryName: category?.name || 'Lainnya',
        categoryColor: category?.color || '#0F9B8E',
        categoryIcon: category?.icon || '•',
        total: amount,
        count: item._count.id,
        percentage: total > 0 ? Math.round((amount / total) * 1000) / 10 : 0,
      };
    });
  }
}

function formatMonthLabel(date: Date) {
  return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
}

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 100);
}

function formatIdr(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function buildMonthlyHighlights(input: {
  currentIncome: number;
  currentExpense: number;
  previousIncome: number;
  previousExpense: number;
  currentBalance: number;
  previousBalance: number;
  topName: string | null;
  topTotal: number;
  topPct: number;
  prevSameTotal: number | null;
  prevTopName: string | null;
}) {
  const highlights: Array<{
    id: string;
    tone: 'warning' | 'success' | 'info' | 'caution';
    title: string;
    message: string;
    tip?: string;
  }> = [];

  const hasData =
    input.currentIncome > 0 ||
    input.currentExpense > 0 ||
    input.previousIncome > 0 ||
    input.previousExpense > 0;

  if (!hasData) {
    return [
      {
        id: 'empty',
        tone: 'info' as const,
        title: 'Belum ada data bulan ini',
        message:
          'Catat pemasukan dan pengeluaran supaya insight bisa membandingkan bulan ini dengan bulan lalu.',
        tip: 'Mulai dari transaksi harian yang paling sering.',
      },
    ];
  }

  const expensePct = percentChange(input.currentExpense, input.previousExpense);
  if (expensePct === null && input.currentExpense > 0) {
    highlights.push({
      id: 'expense-new',
      tone: 'info',
      title: 'Pengeluaran mulai tercatat',
      message: `Bulan lalu belum ada pengeluaran di periode yang sama. Bulan ini sudah ${formatIdr(input.currentExpense)}.`,
    });
  } else if (expensePct !== null && expensePct >= 15) {
    highlights.push({
      id: 'expense-up',
      tone: 'warning',
      title: 'Pengeluaran naik',
      message: `Pengeluaran naik ${expensePct}% dibanding periode yang sama bulan lalu (${formatIdr(input.previousExpense)} → ${formatIdr(input.currentExpense)}).`,
      tip: 'Cek kategori terbesar dan tunda belanja yang bisa ditunda.',
    });
  } else if (expensePct !== null && expensePct <= -10) {
    highlights.push({
      id: 'expense-down',
      tone: 'success',
      title: 'Pengeluaran turun',
      message: `Pengeluaran turun ${Math.abs(expensePct)}% dibanding periode yang sama bulan lalu (${formatIdr(input.previousExpense)} → ${formatIdr(input.currentExpense)}).`,
      tip: 'Pertahankan pola ini dan alihkan selisihnya ke tabungan.',
    });
  }

  if (input.topName && input.topTotal > 0) {
    const grew =
      input.prevSameTotal != null && input.topTotal > input.prevSameTotal
        ? ` Naik dari ${formatIdr(input.prevSameTotal)} bulan lalu.`
        : input.prevSameTotal != null && input.topTotal < input.prevSameTotal
          ? ` Turun dari ${formatIdr(input.prevSameTotal)} bulan lalu.`
          : '';
    highlights.push({
      id: 'top-category',
      tone: input.topPct >= 40 ? 'caution' : 'info',
      title: `Terbesar: ${input.topName}`,
      message: `“${input.topName}” memakai ${input.topPct}% pengeluaran bulan ini (${formatIdr(input.topTotal)}).${grew}`,
      tip:
        input.topPct >= 40
          ? 'Proporsi ini cukup dominan. Cek apakah masih sesuai prioritasmu.'
          : undefined,
    });
  }

  if (input.currentBalance < 0) {
    highlights.push({
      id: 'deficit',
      tone: 'warning',
      title: 'Bulan ini masih defisit',
      message: `Sampai hari ini saldo ${formatIdr(input.currentBalance)}. Bulan lalu di periode yang sama ${formatIdr(input.previousBalance)}.`,
      tip: 'Prioritaskan kebutuhan pokok sampai pemasukan berikutnya masuk.',
    });
  } else if (input.currentIncome > 0 && input.currentBalance > 0) {
    const rate = Math.round((input.currentBalance / input.currentIncome) * 100);
    highlights.push({
      id: 'surplus',
      tone: 'success',
      title: 'Masih ada sisa',
      message: `Sisa bulan ini ${formatIdr(input.currentBalance)} (~${rate}% dari pemasukan). Bulan lalu di periode yang sama ${formatIdr(input.previousBalance)}.`,
      tip: rate >= 20 ? 'Alokasikan sisa ke target tabungan.' : 'Coba tahan belanja agar sisa naik ke 20%.',
    });
  }

  if (highlights.length === 0 && input.prevTopName) {
    highlights.push({
      id: 'steady',
      tone: 'info',
      title: 'Pola relatif stabil',
      message: `Pengeluaran tidak bergeser jauh dari bulan lalu. Kategori terbesar sebelumnya: ${input.prevTopName}.`,
    });
  }

  return highlights.slice(0, 3);
}

export const dashboardService = new DashboardService();
