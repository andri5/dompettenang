import { Router } from 'express';
import { recurringService } from '../services/recurring.service.js';
import { authMiddleware, requireProMiddleware, validate } from '../middlewares/index.js';
import { sendCreated, sendError, sendNotFound, sendSuccess } from '../utils/response.js';
import { paramString } from '../utils/params.js';
import {
  createRecurringSchema,
  setRecurringActiveSchema,
} from '../utils/validation.js';
import type { AuthenticatedRequest } from '../types/index.js';

const router = Router();
router.use(authMiddleware);
router.use(requireProMiddleware);

router.get('/', async (req, res) => {
  try {
    const { userId } = (req as AuthenticatedRequest).user!;
    const rows = await recurringService.list(userId);
    sendSuccess(res, rows, 'Recurring transactions retrieved');
  } catch (error) {
    sendError(res, error instanceof Error ? error.message : 'Failed', 500, 'RECURRING_LIST_FAILED');
  }
});

router.post('/', validate(createRecurringSchema), async (req, res) => {
  try {
    const { userId } = (req as AuthenticatedRequest).user!;
    const row = await recurringService.create(userId, req.body);
    sendCreated(res, row, 'Recurring transaction created');
  } catch (error) {
    sendError(res, error instanceof Error ? error.message : 'Failed', 400, 'RECURRING_CREATE_FAILED');
  }
});

router.patch('/:id/active', validate(setRecurringActiveSchema), async (req, res) => {
  try {
    const { userId } = (req as AuthenticatedRequest).user!;
    const row = await recurringService.setActive(
      userId,
      paramString(req.params.id),
      req.body.isActive
    );
    if (!row) {
      sendNotFound(res, 'Recurring transaction not found');
      return;
    }
    sendSuccess(res, row, 'Recurring transaction updated');
  } catch (error) {
    sendError(res, error instanceof Error ? error.message : 'Failed', 400, 'RECURRING_UPDATE_FAILED');
  }
});

router.post('/run', async (req, res) => {
  try {
    const { userId } = (req as AuthenticatedRequest).user!;
    const result = await recurringService.runDue(userId);
    sendSuccess(res, result, 'Recurring due transactions executed');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to run recurring';
    sendError(res, message, 400, 'RECURRING_RUN_FAILED');
  }
});

export default router;
