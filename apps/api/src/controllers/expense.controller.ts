import { Request, Response } from 'express';
import { expenseService } from '../services/expense.service.js';
import { auditService } from '../services/audit.service.js';
import { sendSuccess, sendCreated, sendError, sendNotFound } from '../utils/response.js';
import { expenseQuerySchema } from '../utils/validation.js';
import type { CreateExpenseInput, UpdateExpenseInput } from '../utils/validation.js';
import type { AuthenticatedRequest } from '../types/index.js';
import { paramString } from '../utils/params.js';

export class ExpenseController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = (req as AuthenticatedRequest).user!;
      const query = expenseQuerySchema.parse(req.query);
      const result = await expenseService.getAll(userId, query);
      sendSuccess(res, result.expenses, 'Expenses retrieved successfully', 200, result.meta);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get expenses';
      sendError(res, message, 500, 'GET_EXPENSES_FAILED');
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = (req as AuthenticatedRequest).user!;
      const id = paramString(req.params.id);
      const expense = await expenseService.getById(id, userId);
      
      if (!expense) {
        sendNotFound(res, 'Expense not found');
        return;
      }
      
      sendSuccess(res, expense, 'Expense retrieved successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get expense';
      sendError(res, message, 500, 'GET_EXPENSE_FAILED');
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = (req as AuthenticatedRequest).user!;
      const data: CreateExpenseInput = req.body;
      const expense = await expenseService.create(userId, data);

      void auditService.log({
        userId,
        actorRole: (req as AuthenticatedRequest).user?.role,
        action: 'CREATE_EXPENSE',
        entityType: 'expense',
        entityId: expense.id,
        summary: `Create expense ${expense.id}`,
        metadata: { type: expense.type, amount: expense.amount, categoryId: expense.categoryId },
      });

      sendCreated(res, expense, 'Expense created successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create expense';
      if (message === 'Category not found') {
        sendNotFound(res, message);
      } else {
        sendError(res, message, 400, 'CREATE_EXPENSE_FAILED');
      }
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = (req as AuthenticatedRequest).user!;
      const id = paramString(req.params.id);
      const data: UpdateExpenseInput = req.body;
      const expense = await expenseService.update(id, userId, data);
      
      if (!expense) {
        sendNotFound(res, 'Expense not found');
        return;
      }
      
      sendSuccess(res, expense, 'Expense updated successfully');

      void auditService.log({
        userId,
        actorRole: (req as AuthenticatedRequest).user?.role,
        action: 'UPDATE_EXPENSE',
        entityType: 'expense',
        entityId: expense.id,
        summary: `Update expense ${expense.id}`,
        metadata: { type: expense.type, amount: expense.amount, categoryId: expense.categoryId },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update expense';
      if (message === 'Category not found') {
        sendNotFound(res, message);
      } else {
        sendError(res, message, 400, 'UPDATE_EXPENSE_FAILED');
      }
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = (req as AuthenticatedRequest).user!;
      const id = paramString(req.params.id);
      const deleted = await expenseService.delete(id, userId);
      
      if (!deleted) {
        sendNotFound(res, 'Expense not found');
        return;
      }
      
      sendSuccess(res, null, 'Expense deleted successfully');

      void auditService.log({
        userId,
        actorRole: (req as AuthenticatedRequest).user?.role,
        action: 'DELETE_EXPENSE',
        entityType: 'expense',
        entityId: id,
        summary: `Delete expense ${id}`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete expense';
      sendError(res, message, 400, 'DELETE_EXPENSE_FAILED');
    }
  }
}

export const expenseController = new ExpenseController();
