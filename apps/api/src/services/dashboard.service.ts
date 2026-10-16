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

export const dashboardService = new DashboardService();
