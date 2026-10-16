import { Request, Response } from 'express';
import { categoryService } from '../services/category.service.js';
import { auditService } from '../services/audit.service.js';
import { sendSuccess, sendCreated, sendError, sendNotFound } from '../utils/response.js';
import { categoryQuerySchema } from '../utils/validation.js';
import type { CreateCategoryInput, UpdateCategoryInput } from '../utils/validation.js';
import type { AuthenticatedRequest } from '../types/index.js';
import { paramString } from '../utils/params.js';

export class CategoryController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = (req as AuthenticatedRequest).user!;
      const query = categoryQuerySchema.parse(req.query);
      const categories = await categoryService.getAll(userId, query);
      sendSuccess(res, categories, 'Categories retrieved successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get categories';
      sendError(res, message, 500, 'GET_CATEGORIES_FAILED');
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = (req as AuthenticatedRequest).user!;
      const id = paramString(req.params.id);
      const category = await categoryService.getById(id, userId);
      
      if (!category) {
        sendNotFound(res, 'Category not found');
        return;
      }
      
      sendSuccess(res, category, 'Category retrieved successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get category';
      sendError(res, message, 500, 'GET_CATEGORY_FAILED');
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = (req as AuthenticatedRequest).user!;
      const data: CreateCategoryInput = req.body;
      const category = await categoryService.create(userId, data);

      void auditService.log({
        userId,
        actorRole: (req as AuthenticatedRequest).user?.role,
        action: 'CREATE_CATEGORY',
        entityType: 'category',
        entityId: category.id,
        summary: `Create category ${category.name}`,
        metadata: { name: category.name, type: category.type },
      });

      sendCreated(res, category, 'Category created successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create category';
      sendError(res, message, 400, 'CREATE_CATEGORY_FAILED');
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = (req as AuthenticatedRequest).user!;
      const id = paramString(req.params.id);
      const data: UpdateCategoryInput = req.body;
      const category = await categoryService.update(id, userId, data);
      
      if (!category) {
        sendNotFound(res, 'Kategori tidak ditemukan atau tidak dapat diubah');
        return;
      }

      sendSuccess(res, category, 'Category updated successfully');

      void auditService.log({
        userId,
        actorRole: (req as AuthenticatedRequest).user?.role,
        action: 'UPDATE_CATEGORY',
        entityType: 'category',
        entityId: category.id,
        summary: `Update category ${category.name}`,
        metadata: { name: category.name, type: category.type },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update category';
      if (message.includes('default') || message.includes('bawaan')) {
        sendError(res, message, 403, 'DEFAULT_CATEGORY_PROTECTED');
      } else {
        sendError(res, message, 400, 'UPDATE_CATEGORY_FAILED');
      }
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = (req as AuthenticatedRequest).user!;
      const id = paramString(req.params.id);
      const deleted = await categoryService.delete(id, userId);

      if (!deleted) {
        sendNotFound(res, 'Kategori tidak ditemukan atau tidak dapat dihapus');
        return;
      }

      sendSuccess(res, null, 'Category deleted successfully');

      void auditService.log({
        userId,
        actorRole: (req as AuthenticatedRequest).user?.role,
        action: 'DELETE_CATEGORY',
        entityType: 'category',
        entityId: id,
        summary: `Delete category ${id}`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete category';
      if (message.includes('default') || message.includes('bawaan')) {
        sendError(res, message, 403, 'DEFAULT_CATEGORY_PROTECTED');
      } else if (message.includes('pengganti') || message.includes('existing expenses')) {
        sendError(res, message, 409, 'CATEGORY_HAS_EXPENSES');
      } else {
        sendError(res, message, 400, 'DELETE_CATEGORY_FAILED');
      }
    }
  }
}

export const categoryController = new CategoryController();
