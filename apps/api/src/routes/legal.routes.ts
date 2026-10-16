import { Router } from 'express';
import type { Request, Response } from 'express';
import { paramString } from '../utils/params.js';
import { getLegalDocument } from '../services/legal.service.js';

const router = Router();

router.get('/legal/:key', async (req: Request, res: Response) => {
  const key = paramString(req.params.key);
  if (!['terms', 'privacy'].includes(key)) {
    res.status(404).json({ success: false, message: 'Dokumen tidak ditemukan' });
    return;
  }

  const doc = await getLegalDocument(key);
  if (!doc) {
    res.status(404).json({ success: false, message: 'Dokumen tidak ditemukan' });
    return;
  }

  res.json({ success: true, data: doc });
});

export default router;
