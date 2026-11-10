/**
 * Ensure shared default categories exist (idempotent + race-safe).
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

/** Postgres advisory lock key for default-category bootstrap */
const DEFAULT_CATEGORY_LOCK = 834_201;

async function ensureDefaultCategoryUniqueIndex(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS categories_default_type_name_uidx
    ON categories (type, name)
    WHERE user_id IS NULL AND is_default = true
  `);
}

/**
 * Keep one shared default per (type, name); reassign FKs then delete extras.
 */
export async function dedupeDefaultCategories(): Promise<number> {
  const cats = await prisma.category.findMany({
    where: { userId: null, isDefault: true },
    orderBy: { createdAt: 'asc' },
    include: {
      _count: { select: { expenses: true } },
    },
  });

  const groups = new Map<string, typeof cats>();
  for (const c of cats) {
    const key = `${c.type}|${c.name}`;
    const list = groups.get(key) ?? [];
    list.push(c);
    groups.set(key, list);
  }

  let deleted = 0;
  for (const rows of groups.values()) {
    if (rows.length < 2) continue;

    rows.sort((a, b) => {
      if (b._count.expenses !== a._count.expenses) {
        return b._count.expenses - a._count.expenses;
      }
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    const keep = rows[0];
    for (const dup of rows.slice(1)) {
      await prisma.$transaction([
        prisma.expense.updateMany({
          where: { categoryId: dup.id },
          data: { categoryId: keep.id },
        }),
        prisma.categoryBudget.deleteMany({ where: { categoryId: dup.id } }),
        prisma.recurringTransaction.updateMany({
          where: { categoryId: dup.id },
          data: { categoryId: keep.id },
        }),
        prisma.category.delete({ where: { id: dup.id } }),
      ]);
      deleted += 1;
    }
  }

  return deleted;
}

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
    orderBy: { createdAt: 'asc' },
  });

  if (!existing) {
    try {
      await prisma.category.create({
        data: {
          ...category,
          type,
          isDefault: true,
          userId: null,
        },
      });
    } catch {
      // Unique index race: another process inserted the same default.
    }
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
  await prisma.$executeRaw`SELECT pg_advisory_lock(${DEFAULT_CATEGORY_LOCK})`;
  try {
    // Dedupe first — unique index cannot be created while duplicates remain.
    await dedupeDefaultCategories();
    await ensureDefaultCategoryUniqueIndex();

    for (const category of EXPENSE_DEFAULTS) {
      await upsertDefault('EXPENSE', category);
    }
    for (const category of INCOME_DEFAULTS) {
      await upsertDefault('INCOME', category);
    }
  } finally {
    await prisma.$executeRaw`SELECT pg_advisory_unlock(${DEFAULT_CATEGORY_LOCK})`;
  }
}
