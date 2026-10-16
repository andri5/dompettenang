import { Router } from 'express';
import { prisma } from '../utils/prisma.js';
import {
  authMiddleware,
  optionalAuthMiddleware,
  validate,
} from '../middlewares/index.js';
import { createFeedbackSchema } from '../utils/validation.js';
import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../types/index.js';

const router = Router();

/** Public: published testimonials for landing page */
router.get('/testimonials', async (_req: Request, res: Response) => {
  const items = await prisma.feedback.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: 'desc' },
    take: 12,
    select: {
      id: true,
      name: true,
      message: true,
      rating: true,
      createdAt: true,
      user: {
        select: {
          gender: true,
          name: true,
        },
      },
    },
  });

  const genderLabel = (g: 'MALE' | 'FEMALE' | 'OTHER' | null | undefined) => {
    if (g === 'MALE') return 'Laki-laki';
    if (g === 'FEMALE') return 'Perempuan';
    return null;
  };

  res.json({
    success: true,
    data: items.map((f) => {
      const gender = genderLabel(f.user?.gender ?? null);
      return {
        id: f.id,
        name: f.name?.trim() || f.user?.name?.trim() || 'Anonim',
        role: gender ? `Pengguna · ${gender}` : 'Pengguna',
        gender,
        text: f.message,
        stars: Math.min(5, Math.max(0, f.rating || 0)),
      };
    }),
  });
});

router.get('/status', authMiddleware, async (req: Request, res: Response) => {
  const { userId } = (req as AuthenticatedRequest).user!;
  const existing = await prisma.feedback.findUnique({
    where: { userId },
    select: { id: true },
  });
  res.json({ success: true, data: { submitted: !!existing } });
});

router.post(
  '/',
  optionalAuthMiddleware,
  validate(createFeedbackSchema),
  async (req: Request, res: Response) => {
    const { name, message, rating } = req.body as {
      name: string | null;
      message: string;
      rating: number;
    };

    const authUser = (req as AuthenticatedRequest).user;

    if (authUser) {
      const existing = await prisma.feedback.findUnique({
        where: { userId: authUser.userId },
        select: { id: true },
      });
      if (existing) {
        res.status(409).json({
          success: false,
          message: 'Kamu sudah mengirim masukan sebelumnya. Terima kasih!',
        });
        return;
      }
    }

    try {
      const feedback = await prisma.feedback.create({
        data: {
          userId: authUser?.userId ?? null,
          name,
          message,
          rating,
        },
      });
      res.status(201).json({ success: true, data: { id: feedback.id } });
    } catch (e) {
      console.error('Feedback create failed:', e);
      res.status(500).json({ success: false, message: 'Gagal menyimpan masukan' });
    }
  }
);

export default router;
