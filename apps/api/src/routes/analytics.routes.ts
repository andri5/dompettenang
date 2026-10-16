import { Router } from 'express';
import { prisma } from '../utils/prisma.js';
import type { Request, Response } from 'express';

const router = Router();

router.post('/analytics/visit', async (req: Request, res: Response) => {
  const { path, source, sessionId, deviceType } = req.body as {
    path?: string;
    source?: string;
    sessionId?: string;
    deviceType?: string;
  };

  if (!path || typeof path !== 'string' || !sessionId || typeof sessionId !== 'string') {
    res.status(400).json({ success: false, message: 'path and sessionId are required' });
    return;
  }

  try {
    await prisma.visitEvent.create({
      data: {
        sessionId: sessionId.slice(0, 120),
        path: path.slice(0, 500),
        source: typeof source === 'string' ? source.slice(0, 80) : 'web',
        deviceType: typeof deviceType === 'string' ? deviceType.slice(0, 50) : undefined,
      },
    });
  } catch (e) {
    console.error('VisitEvent failed:', e);
    res.status(500).json({ success: false, message: 'Failed to record visit' });
    return;
  }

  res.json({ success: true });
});

export default router;

