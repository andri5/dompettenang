import { Request, Response } from 'express';
import { dashboardService } from '../services/dashboard.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { dashboardQuerySchema } from '../utils/validation.js';
import type { AuthenticatedRequest } from '../types/index.js';

export class DashboardController {
  async getSummary(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = (req as AuthenticatedRequest).user!;
      const query = dashboardQuerySchema.parse(req.query);
      const summary = await dashboardService.getSummary(userId, query);
      sendSuccess(res, summary, 'Dashboard summary retrieved successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get dashboard summary';
      sendError(res, message, 500, 'GET_DASHBOARD_FAILED');
    }
  }
}

export const dashboardController = new DashboardController();
