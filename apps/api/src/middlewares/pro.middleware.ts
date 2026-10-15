/**
 * Require Dompet Tenang Pro (ADMIN always allowed).
 */

import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma.js';
import { hasProAccess } from '../utils/plan.js';
import { sendUnauthorized } from '../utils/response.js';
import type { AuthenticatedRequest } from '../types/index.js';

export const requireProMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const auth = (req as AuthenticatedRequest).user;
    if (!auth?.userId) {
      sendUnauthorized(res, 'Access token is required');
      return;
    }

    if (auth.role === 'ADMIN') {
      next();
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { role: true, plan: true, proExpiresAt: true },
    });

    if (!user || !hasProAccess(user)) {
      res.status(403).json({
        success: false,
        message: 'Fitur ini tersedia di Dompet Tenang Pro',
        error: { code: 'PRO_REQUIRED' },
      });
      return;
    }

    next();
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Pro check failed';
    res.status(500).json({ success: false, message });
  }
};
