/**
 * Ensure shared default categories exist (idempotent).
 * Production DBs created via `prisma db push` often skip `db seed`.
 */

import { prisma } from '../utils/prisma.js';

const EXPENSE_DEFAULTS = [
  { name: 'Makanan', icon: 'utensils', color: '#FF5733' },
  { name: 'Transportasi', icon: 'car', color: '#3498DB' },
  { name: 'Belanja', icon: 'shopping-bag', color: '#2ECC71' },
  { name: 'Tagihan', icon: 'zap', color: '#F39C12' },
  { name: 'Kesehatan', icon: 'heart-pulse', color: '#E74C3C' },
  { name: 'Hiburan', icon: 'gamepad-2', color: '#9B59B6' },
  { name: 'Pendidikan', icon: 'graduation-cap', color: '#1ABC9C' },
  { name: 'Pakaian', icon: 'shopping-bag', color: '#E91E63' },
  { name: 'Rumah Tangga', icon: 'home', color: '#795548' },
  { name: 'Lainnya', icon: 'more-horizontal', color: '#607D8B' },
] as const;

const INCOME_DEFAULTS = [
  { name: 'Gaji', icon: 'banknote', color: '#0F9B8E' },
  { name: 'Freelance', icon: 'laptop', color: '#14B8A6' },
  { name: 'Bisnis', icon: 'briefcase', color: '#22C55E' },
  { name: 'Investasi', icon: 'line-chart', color: '#06B6D4' },
  { name: 'Bonus', icon: 'gift', color: '#84CC16' },
  { name: 'Lainnya', icon: 'sparkles', color: '#10B981' },
] as const;

async function upsertDefault(
  type: 'EXPENSE' | 'INCOME',
  category: { name: string; icon: string; color: string }
) {
  const existing = await prisma.category.findFirst({
    where: {
      name: category.name,
      isDefault: true,
      userId: null,
      type,
    },
  });

  if (!existing) {
    await prisma.category.create({
      data: {
        ...category,
        type,
        isDefault: true,
        userId: null,
      },
    });
    return;
  }

  if (existing.icon !== category.icon || existing.color !== category.color) {
    await prisma.category.update({
      where: { id: existing.id },
      data: { icon: category.icon, color: category.color },
    });
  }
}

export async function ensureDefaultCategories(): Promise<void> {
  for (const category of EXPENSE_DEFAULTS) {
    await upsertDefault('EXPENSE', category);
  }
  for (const category of INCOME_DEFAULTS) {
    await upsertDefault('INCOME', category);
  }
}
