import { Router } from 'express';
import { savingsService } from '../services/savings.service.js';
import { authMiddleware, requireProMiddleware, validate } from '../middlewares/index.js';
import { paramString } from '../utils/params.js';
import {
  addSavingsAmountSchema,
  createSavingsSchema,
  updateSavingsSchema,
} from '../utils/validation.js';
import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../types/index.js';

const router = Router();

router.use(authMiddleware);
router.use(requireProMiddleware);

router.get('/', async (req: Request, res: Response) => {
  const { userId } = (req as AuthenticatedRequest).user!;
  const goals = await savingsService.list(userId);
  res.json({ success: true, data: goals });
});

router.post('/', validate(createSavingsSchema), async (req: Request, res: Response) => {
  try {
    const { userId } = (req as AuthenticatedRequest).user!;
    const goal = await savingsService.create(userId, req.body);
    res.status(201).json({ success: true, data: goal });
  } catch (e) {
    res.status(400).json({
      success: false,
      message: e instanceof Error ? e.message : 'Gagal membuat target',
    });
  }
});

router.patch(
  '/:id/add',
  validate(addSavingsAmountSchema),
  async (req: Request, res: Response) => {
    try {
      const { userId } = (req as AuthenticatedRequest).user!;
      const id = paramString(req.params.id);
      const goal = await savingsService.addAmount(userId, id, req.body.amount);
      res.json({ success: true, data: goal });
    } catch (e) {
      res.status(400).json({
        success: false,
        message: e instanceof Error ? e.message : 'Gagal menambah tabungan',
      });
    }
  }
);

router.put('/:id', validate(updateSavingsSchema), async (req: Request, res: Response) => {
  try {
    const { userId } = (req as AuthenticatedRequest).user!;
    const id = paramString(req.params.id);
    const goal = await savingsService.update(userId, id, req.body);
    res.json({ success: true, data: goal });
  } catch (e) {
    res.status(400).json({
      success: false,
      message: e instanceof Error ? e.message : 'Gagal memperbarui target',
    });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  const { userId } = (req as AuthenticatedRequest).user!;
  const id = paramString(req.params.id);
  await savingsService.delete(userId, id);
  res.json({ success: true, message: 'Goal deleted' });
});

export default router;
