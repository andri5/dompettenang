import { prisma } from '../utils/prisma.js';
import type { CreateBudgetInput, UpdateBudgetInput } from '../utils/validation.js';
import type { BudgetStatus, CategoryBudgetStatus } from '../types/index.js';

function currentMonth(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function monthRange(month: string): { startDate: Date; endDate: Date } {
  const [year, mon] = month.split('-').map(Number);
  const startDate = new Date(year, mon - 1, 1, 0, 0, 0, 0);
  const endDate = new Date(year, mon, 0, 23, 59, 59, 999);
  return { startDate, endDate };
}

function toNumber(value: unknown): number {
  return Number(value) || 0;
}

function calcProgress(budget: number, spent: number) {
  const remaining = Math.max(budget - spent, 0);
  const percentUsed = budget > 0 ? Math.round((spent / budget) * 1000) / 10 : 0;
  return {
    remaining,
    percentUsed,
    isNearLimit: budget > 0 && spent >= budget * 0.8 && spent <= budget,
    isOverLimit: budget > 0 && spent > budget,
  };
}

export class BudgetService {
  async getStatus(userId: string, month = currentMonth()): Promise<BudgetStatus> {
    const { startDate, endDate } = monthRange(month);

    const [budget, expenseGroups, totalAgg] = await Promise.all([
      prisma.budget.findUnique({
        where: { userId_month: { userId, month } },
        include: {
          categoryBudgets: {
            include: {
              category: {
                select: { id: true, name: true, icon: true, color: true },
              },
            },
          },
        },
      }),
      prisma.expense.groupBy({
        by: ['categoryId'],
        where: {
          userId,
          type: 'EXPENSE',
          deletedAt: null,
          date: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
      }),
      prisma.expense.aggregate({
        where: {
          userId,
          type: 'EXPENSE',
          deletedAt: null,
          date: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
      }),
    ]);

    const spentByCategory = new Map<string, number>(
      expenseGroups.map((row) => [row.categoryId, toNumber(row._sum.amount)])
    );
    const totalSpent = toNumber(totalAgg._sum.amount);
    const totalBudget = budget ? toNumber(budget.totalBudget) : 0;
    const totalProgress = calcProgress(totalBudget, totalSpent);

    const categoryBudgets: CategoryBudgetStatus[] = (budget?.categoryBudgets ?? []).map(
      (row) => {
        const budgetAmount = toNumber(row.amount);
        const spent = spentByCategory.get(row.categoryId) ?? 0;
        const progress = calcProgress(budgetAmount, spent);
        return {
          categoryId: row.categoryId,
          categoryName: row.category.name,
          categoryIcon: row.category.icon,
          categoryColor: row.category.color,
          budgetAmount,
          spent,
          remaining: progress.remaining,
          percentUsed: progress.percentUsed,
          isNearLimit: progress.isNearLimit,
          isOverLimit: progress.isOverLimit,
        };
      }
    );

    return {
      id: budget?.id ?? null,
      month,
      totalBudget,
      totalSpent,
      totalRemaining: totalProgress.remaining,
      percentUsed: totalProgress.percentUsed,
      isNearLimit: totalProgress.isNearLimit,
      isOverLimit: totalProgress.isOverLimit,
      hasBudget: !!budget,
      categoryBudgets,
    };
  }

  async upsert(userId: string, data: CreateBudgetInput | UpdateBudgetInput): Promise<BudgetStatus> {
    const month = data.month ?? currentMonth();
    const totalBudget = data.totalBudget;
    if (totalBudget === undefined || totalBudget <= 0) {
      throw new Error('Total budget wajib diisi');
    }

    const categoryIds = data.categoryBudgets?.map((c) => c.categoryId) ?? [];
    if (categoryIds.length > 0) {
      const owned = await prisma.category.count({
        where: {
          id: { in: categoryIds },
          OR: [{ userId }, { userId: null, isDefault: true }],
          type: 'EXPENSE',
        },
      });
      if (owned !== categoryIds.length) {
        throw new Error('Salah satu kategori budget tidak valid');
      }
    }

    await prisma.$transaction(async (tx) => {
      const budget = await tx.budget.upsert({
        where: { userId_month: { userId, month } },
        create: {
          userId,
          month,
          totalBudget,
        },
        update: {
          totalBudget,
        },
      });

      if (data.categoryBudgets !== undefined) {
        await tx.categoryBudget.deleteMany({ where: { budgetId: budget.id } });
        if (data.categoryBudgets.length > 0) {
          await tx.categoryBudget.createMany({
            data: data.categoryBudgets.map((row) => ({
              budgetId: budget.id,
              categoryId: row.categoryId,
              amount: row.amount,
            })),
          });
        }
      }
    });

    return this.getStatus(userId, month);
  }

  async remove(userId: string, month: string): Promise<boolean> {
    const existing = await prisma.budget.findUnique({
      where: { userId_month: { userId, month } },
    });
    if (!existing) return false;
    await prisma.budget.delete({ where: { id: existing.id } });
    return true;
  }
}

export const budgetService = new BudgetService();
