import { prisma } from '../utils/prisma.js';

export class SavingsService {
  async list(userId: string) {
    const goals = await prisma.savingsGoal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return goals.map(this.format);
  }

  async create(userId: string, data: {
    name: string;
    targetAmount: number;
    deadline?: string | null;
    icon?: string;
    color?: string;
  }) {
    const goal = await prisma.savingsGoal.create({
      data: {
        userId,
        name: data.name,
        targetAmount: data.targetAmount,
        deadline: data.deadline ? new Date(data.deadline) : null,
        icon: data.icon || 'flag',
        color: data.color || '#0f9b8e',
      },
    });
    return this.format(goal);
  }

  async addAmount(userId: string, goalId: string, amount: number) {
    const goal = await prisma.savingsGoal.findFirst({
      where: { id: goalId, userId },
    });
    if (!goal) throw new Error('Goal not found');

    const newSaved = Number(goal.savedAmount) + amount;
    const isCompleted = newSaved >= Number(goal.targetAmount);

    const updated = await prisma.savingsGoal.update({
      where: { id: goalId },
      data: { savedAmount: newSaved, isCompleted },
    });
    return this.format(updated);
  }

  async update(userId: string, goalId: string, data: {
    name?: string;
    targetAmount?: number;
    savedAmount?: number;
    deadline?: string | null;
    icon?: string;
    color?: string;
  }) {
    const goal = await prisma.savingsGoal.findFirst({
      where: { id: goalId, userId },
    });
    if (!goal) throw new Error('Goal not found');

    const savedAmount = data.savedAmount ?? Number(goal.savedAmount);
    const targetAmount = data.targetAmount ?? Number(goal.targetAmount);

    const updated = await prisma.savingsGoal.update({
      where: { id: goalId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.targetAmount !== undefined ? { targetAmount: data.targetAmount } : {}),
        ...(data.savedAmount !== undefined ? { savedAmount: data.savedAmount } : {}),
        ...(data.deadline !== undefined ? { deadline: data.deadline ? new Date(data.deadline) : null } : {}),
        ...(data.icon !== undefined ? { icon: data.icon } : {}),
        ...(data.color !== undefined ? { color: data.color } : {}),
        isCompleted: savedAmount >= targetAmount,
      },
    });
    return this.format(updated);
  }

  async delete(userId: string, goalId: string) {
    const goal = await prisma.savingsGoal.findFirst({
      where: { id: goalId, userId },
    });
    if (!goal) throw new Error('Goal not found');
    await prisma.savingsGoal.delete({ where: { id: goalId } });
  }

  private format(goal: any) {
    return {
      id: goal.id,
      name: goal.name,
      targetAmount: Number(goal.targetAmount),
      savedAmount: Number(goal.savedAmount),
      deadline: goal.deadline ? goal.deadline.toISOString().split('T')[0] : null,
      icon: goal.icon,
      color: goal.color,
      isCompleted: goal.isCompleted,
      percentSaved: Number(goal.targetAmount) > 0
        ? Math.min(100, Math.round((Number(goal.savedAmount) / Number(goal.targetAmount)) * 100))
        : 0,
      remaining: Math.max(0, Number(goal.targetAmount) - Number(goal.savedAmount)),
      createdAt: goal.createdAt,
    };
  }
}

export const savingsService = new SavingsService();
