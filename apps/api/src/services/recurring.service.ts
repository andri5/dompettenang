import { prisma } from '../utils/prisma.js';
import type { RecurringFrequency, TransactionType } from '@prisma/client';

export type CreateRecurringInput = {
  categoryId: string;
  type?: TransactionType;
  amount: number;
  note?: string;
  frequency: RecurringFrequency;
  startDate: string;
  endDate?: string;
};

export class RecurringService {
  async list(userId: string) {
    return prisma.recurringTransaction.findMany({
      where: { userId },
      include: {
        category: { select: { id: true, name: true, icon: true, color: true, type: true } },
      },
      orderBy: [{ isActive: 'desc' }, { nextRunDate: 'asc' }],
    });
  }

  async create(userId: string, data: CreateRecurringInput) {
    const start = new Date(`${data.startDate}T00:00:00`);
    return prisma.recurringTransaction.create({
      data: {
        userId,
        categoryId: data.categoryId,
        type: data.type ?? 'EXPENSE',
        amount: data.amount,
        note: data.note,
        frequency: data.frequency,
        startDate: start,
        endDate: data.endDate ? new Date(`${data.endDate}T00:00:00`) : null,
        nextRunDate: start,
      },
      include: {
        category: { select: { id: true, name: true, icon: true, color: true, type: true } },
      },
    });
  }

  async setActive(userId: string, id: string, isActive: boolean) {
    const existing = await prisma.recurringTransaction.findFirst({ where: { id, userId } });
    if (!existing) return null;
    return prisma.recurringTransaction.update({
      where: { id },
      data: { isActive },
    });
  }

  private advanceRunDate(from: Date, frequency: RecurringFrequency): Date {
    const next = new Date(from);
    if (frequency === 'DAILY') {
      next.setDate(next.getDate() + 1);
      return next;
    }
    if (frequency === 'WEEKLY') {
      next.setDate(next.getDate() + 7);
      return next;
    }
    // MONTHLY
    next.setMonth(next.getMonth() + 1);
    return next;
  }

  /**
   * Create due transactions for all active recurring entries of a user.
   * This is intentionally idempotent-ish: we advance `nextRunDate` right after creating,
   * so subsequent calls won't create duplicates for the same run.
   */
  async runDue(userId: string): Promise<{ created: number; checked: number }> {
    const now = new Date();
    const due = await prisma.recurringTransaction.findMany({
      where: {
        userId,
        isActive: true,
        nextRunDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
      orderBy: [{ nextRunDate: 'asc' }],
    });

    let created = 0;

    for (const row of due) {
      // Catch up missed runs up to `now`
      let next = row.nextRunDate;
      let active = row.isActive;

      while (
        active &&
        next.getTime() <= now.getTime() &&
        (!row.endDate || next.getTime() <= row.endDate.getTime())
      ) {
        await prisma.expense.create({
          data: {
            userId: row.userId,
            categoryId: row.categoryId,
            type: row.type,
            amount: row.amount,
            note: row.note,
            date: next,
          },
        });

        created++;
        next = this.advanceRunDate(next, row.frequency);
      }

      active = row.isActive && (!row.endDate || next.getTime() <= row.endDate.getTime());

      await prisma.recurringTransaction.update({
        where: { id: row.id },
        data: {
          nextRunDate: next,
          isActive: active,
        },
      });
    }

    return { created, checked: due.length };
  }
}

export const recurringService = new RecurringService();
