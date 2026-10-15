import { Router } from 'express';
import { savingsService } from '../services/savings.service.js';
import { authMiddleware, requireProMiddleware } from '../middlewares/index.js';
import { paramString } from '../utils/params.js';
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

router.post('/', async (req: Request, res: Response) => {
  const { userId } = (req as AuthenticatedRequest).user!;
  const goal = await savingsService.create(userId, req.body);
  res.status(201).json({ success: true, data: goal });
});

router.patch('/:id/add', async (req: Request, res: Response) => {
  const { userId } = (req as AuthenticatedRequest).user!;
  const id = paramString(req.params.id);
  const { amount } = req.body;
  const goal = await savingsService.addAmount(userId, id, Number(amount));
  res.json({ success: true, data: goal });
});

router.put('/:id', async (req: Request, res: Response) => {
  const { userId } = (req as AuthenticatedRequest).user!;
  const id = paramString(req.params.id);
  const goal = await savingsService.update(userId, id, req.body);
  res.json({ success: true, data: goal });
});

router.delete('/:id', async (req: Request, res: Response) => {
  const { userId } = (req as AuthenticatedRequest).user!;
  const id = paramString(req.params.id);
  await savingsService.delete(userId, id);
  res.json({ success: true, message: 'Goal deleted' });
});

export default router;
