import { prisma } from '../utils/prisma.js';
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
  CategoryQueryInput,
} from '../utils/validation.js';
import type { CategoryResponse } from '../types/index.js';

export class CategoryService {
  async getAll(userId: string, query: CategoryQueryInput = {}): Promise<CategoryResponse[]> {
    const categories = await prisma.category.findMany({
      where: {
        OR: [
          { userId: null, isDefault: true },
          { userId },
        ],
        ...(query.type ? { type: query.type } : {}),
      },
      include: {
        _count: {
          select: { expenses: true },
        },
      },
      orderBy: [
        { type: 'asc' },
        { isDefault: 'desc' },
        { name: 'asc' },
      ],
    });

    return categories.map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      type: cat.type,
      isDefault: cat.isDefault,
      expenseCount: cat._count.expenses,
    }));
  }

  async getById(id: string, userId: string): Promise<CategoryResponse | null> {
    const category = await prisma.category.findFirst({
      where: {
        id,
        OR: [
          { userId: null, isDefault: true },
          { userId },
        ],
      },
      include: {
        _count: {
          select: { expenses: true },
        },
      },
    });

    if (!category) return null;

    return {
      id: category.id,
      name: category.name,
      icon: category.icon,
      color: category.color,
      type: category.type,
      isDefault: category.isDefault,
      expenseCount: category._count.expenses,
    };
  }

  async create(userId: string, data: CreateCategoryInput): Promise<CategoryResponse> {
    const category = await prisma.category.create({
      data: {
        userId,
        name: data.name,
        icon: data.icon,
        color: data.color,
        type: data.type,
        isDefault: false,
      },
    });

    return {
      id: category.id,
      name: category.name,
      icon: category.icon,
      color: category.color,
      type: category.type,
      isDefault: category.isDefault,
      expenseCount: 0,
    };
  }

  async update(id: string, userId: string, data: UpdateCategoryInput): Promise<CategoryResponse | null> {
    const existing = await prisma.category.findFirst({
      where: {
        id,
        userId,
        isDefault: false,
      },
    });

    if (!existing) {
      const isDefault = await prisma.category.findFirst({
        where: { id, isDefault: true },
      });
      if (isDefault) {
        throw new Error('Kategori default tidak dapat diubah');
      }
      return null;
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.icon && { icon: data.icon }),
        ...(data.color && { color: data.color }),
        ...(data.type && { type: data.type }),
      },
    });

    return {
      id: category.id,
      name: category.name,
      icon: category.icon,
      color: category.color,
      type: category.type,
      isDefault: category.isDefault,
    };
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const existing = await prisma.category.findFirst({
      where: {
        id,
        OR: [
          { userId, isDefault: false },
          { userId: null, isDefault: true },
        ],
      },
    });

    if (!existing) {
      return false;
    }

    // Default/shared categories cannot be deleted (shared across all users)
    if (existing.isDefault || existing.userId === null) {
      throw new Error('Kategori default tidak dapat dihapus. Buat kategori sendiri jika ingin menghapusnya nanti.');
    }

    // Ensure it belongs to the current user
    if (existing.userId !== userId) {
      return false;
    }

    const fallback = await this.findFallbackCategory(existing.type, userId, id);

    if (!fallback) {
      throw new Error('Tidak ada kategori pengganti untuk memindahkan transaksi terkait');
    }

    // Move related transactions so delete does not violate FK
    await prisma.expense.updateMany({
      where: { categoryId: id },
      data: { categoryId: fallback.id },
    });

    await prisma.categoryBudget.deleteMany({
      where: { categoryId: id },
    });

    await prisma.category.delete({ where: { id } });
    return true;
  }

  private async findFallbackCategory(
    type: 'EXPENSE' | 'INCOME',
    userId: string,
    excludeId: string
  ) {
    const fallback = await prisma.category.findFirst({
      where: {
        id: { not: excludeId },
        type,
        OR: [
          { userId: null, isDefault: true, name: 'Lainnya' },
          { userId, isDefault: false, name: 'Lainnya' },
          { userId: null, isDefault: true },
        ],
      },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });

    return fallback;
  }
}

export const categoryService = new CategoryService();
