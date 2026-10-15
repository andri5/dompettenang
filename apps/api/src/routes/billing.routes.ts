import { Router } from 'express';
import type { Request, Response } from 'express';
import { authMiddleware } from '../middlewares/index.js';
import { proofUpload } from '../middlewares/upload.middleware.js';
import type { AuthenticatedRequest } from '../types/index.js';
import { paramString } from '../utils/params.js';
import {
  createPurchaseRequest,
  getPublicPlans,
  listMyRequests,
  submitProof,
} from '../services/billing.service.js';

const router = Router();

router.get('/plans', (_req: Request, res: Response) => {
  res.json({ success: true, data: getPublicPlans() });
});

router.post('/purchase-request', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as AuthenticatedRequest).user!;
    const data = await createPurchaseRequest(userId);
    res.status(201).json({ success: true, data: { ...data, ...getPublicPlans() } });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Gagal membuat permintaan';
    const status = message.includes('sudah Pro') ? 400 : 400;
    res.status(status).json({ success: false, message });
  }
});

router.get('/my-requests', authMiddleware, async (req: Request, res: Response) => {
  const { userId } = (req as AuthenticatedRequest).user!;
  const data = await listMyRequests(userId);
  res.json({ success: true, data });
});

router.post(
  '/purchase-request/:id/proof',
  authMiddleware,
  (req, res, next) => {
    proofUpload.single('proof')(req, res, (err: unknown) => {
      if (err) {
        const message = err instanceof Error ? err.message : 'Upload gagal';
        res.status(400).json({ success: false, message, error: { code: 'UPLOAD_FAILED' } });
        return;
      }
      next();
    });
  },
  async (req: Request, res: Response) => {
    try {
      const { userId } = (req as AuthenticatedRequest).user!;
      const id = paramString(req.params.id);
      const file = req.file;
      if (!file) {
        res.status(400).json({ success: false, message: 'File bukti transfer wajib diunggah' });
        return;
      }
      const proofPath = `/uploads/proofs/${file.filename}`;
      const data = await submitProof(userId, id, proofPath);
      res.json({ success: true, data, message: 'Bukti transfer terkirim. Menunggu verifikasi admin.' });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Gagal mengirim bukti';
      res.status(400).json({ success: false, message });
    }
  }
);

export default router;
