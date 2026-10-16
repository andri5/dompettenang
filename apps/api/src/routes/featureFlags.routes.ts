import { Router } from 'express';
import type { Request, Response } from 'express';
import { getFeatureFlags } from '../services/featureFlags.service.js';

const router = Router();

router.get('/feature-flags', async (_req: Request, res: Response) => {
  const flags = await getFeatureFlags();
  res.json({ success: true, data: flags });
});

export default router;

