import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma.js';
import { authMiddleware, adminMiddleware, validate } from '../middlewares/index.js';
import { paramString } from '../utils/params.js';
import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../types/index.js';
import { auditService } from '../services/audit.service.js';
import { ensureDefaultFeatureFlags, setFeatureFlag } from '../services/featureFlags.service.js';
import {
  listLegalDocuments,
  updateLegalDocument,
} from '../services/legal.service.js';
import {
  adminUpdateUserSchema,
  type AdminUpdateUserInput,
} from '../utils/validation.js';
import {
  approveRequest,
  countOpenProRequests,
  getBillingSettings,
  listAdminRequests,
  rejectRequest,
  updateBillingSettings,
} from '../services/billing.service.js';

const router = Router();

router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/stats', async (_req: Request, res: Response) => {
  const [userCount, txCount, feedbackCount, savingsCount, todayUsers, proOpen] =
    await Promise.all([
      prisma.user.count(),
      prisma.expense.count(),
      prisma.feedback.count(),
      prisma.savingsGoal.count(),
      prisma.user.count({
        where: { createdAt: { gte: new Date(new Date().toISOString().split('T')[0]) } },
      }),
      countOpenProRequests(),
    ]);
  res.json({
    success: true,
    data: {
      users: userCount,
      transactions: txCount,
      feedback: feedbackCount,
      savingsGoals: savingsCount,
      todayUsers,
      proPending: proOpen.pending,
      proProofSubmitted: proOpen.proofSubmitted,
      proOpen: proOpen.open,
    },
  });
});

router.get('/users', async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      currency: true,
      gender: true,
      birthDate: true,
      createdAt: true,
      _count: { select: { expenses: true, savingsGoals: true, budgets: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json({
    success: true,
    data: users.map((u) => ({
      ...u,
      birthDate: u.birthDate ? u.birthDate.toISOString().slice(0, 10) : null,
    })),
  });
});

router.patch('/users/:id', validate(adminUpdateUserSchema), async (req: Request, res: Response) => {
  const id = paramString(req.params.id);
  const body = req.body as AdminUpdateUserInput;
  const currentAdmin = (req as AuthenticatedRequest).user!;

  if (
    Object.keys(body).length === 0 ||
    Object.values(body).every((v) => v === undefined)
  ) {
    res.status(400).json({ success: false, message: 'Tidak ada data yang diubah' });
    return;
  }

  if (currentAdmin.userId === id && body.role && body.role !== 'ADMIN') {
    res.status(400).json({ success: false, message: 'Tidak bisa menurunkan role diri sendiri' });
    return;
  }

  const existing = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true },
  });
  if (!existing) {
    res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    return;
  }

  if (body.email && body.email.toLowerCase() !== existing.email.toLowerCase()) {
    const clash = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
      select: { id: true },
    });
    if (clash) {
      res.status(400).json({ success: false, message: 'Email sudah digunakan user lain' });
      return;
    }
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name.trim() } : {}),
        ...(body.email !== undefined ? { email: body.email.trim().toLowerCase() } : {}),
        ...(body.currency !== undefined ? { currency: body.currency.toUpperCase() } : {}),
        ...(body.gender !== undefined ? { gender: body.gender } : {}),
        ...(body.birthDate !== undefined
          ? {
              birthDate:
                body.birthDate === null
                  ? null
                  : new Date(`${body.birthDate}T00:00:00.000Z`),
            }
          : {}),
        ...(body.role !== undefined ? { role: body.role } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        currency: true,
        gender: true,
        birthDate: true,
        createdAt: true,
      },
    });

    void auditService.log({
      userId: currentAdmin.userId,
      actorRole: currentAdmin.role,
      action: 'UPDATE_USER',
      entityType: 'user',
      entityId: id,
      summary: `Update user ${user.email}`,
      metadata: {
        fields: Object.keys(body).filter((k) => body[k as keyof AdminUpdateUserInput] !== undefined),
      },
    });

    res.json({
      success: true,
      data: {
        ...user,
        birthDate: user.birthDate ? user.birthDate.toISOString().slice(0, 10) : null,
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      res.status(400).json({ success: false, message: 'Email sudah digunakan user lain' });
      return;
    }
    res.status(500).json({ success: false, message: 'Gagal memperbarui user' });
  }
});

router.patch('/users/:id/role', async (req: Request, res: Response) => {
  const id = paramString(req.params.id);
  const { role } = req.body;
  if (!['USER', 'ADMIN'].includes(role)) {
    res.status(400).json({ success: false, message: 'Invalid role' });
    return;
  }
  const currentAdmin = (req as AuthenticatedRequest).user!;
  if (currentAdmin.userId === id && role !== 'ADMIN') {
    res.status(400).json({ success: false, message: 'Tidak bisa menurunkan role diri sendiri' });
    return;
  }
  const user = await prisma.user.update({
    where: { id },
    data: { role },
    select: { id: true, name: true, email: true, role: true },
  });
  void auditService.log({
    userId: currentAdmin.userId,
    actorRole: currentAdmin.role,
    action: 'UPDATE_USER_ROLE',
    entityType: 'user',
    entityId: id,
    summary: `Role ${user.email} -> ${role}`,
    metadata: { role },
  });
  res.json({ success: true, data: user });
});

router.delete('/users/:id', async (req: Request, res: Response) => {
  const id = paramString(req.params.id);
  const currentAdmin = (req as AuthenticatedRequest).user!;
  if (currentAdmin.userId === id) {
    res.status(400).json({ success: false, message: 'Tidak bisa menghapus diri sendiri' });
    return;
  }
  const deleted = await prisma.user.delete({
    where: { id },
    select: { id: true, email: true },
  });
  void auditService.log({
    userId: currentAdmin.userId,
    actorRole: currentAdmin.role,
    action: 'DELETE_USER',
    entityType: 'user',
    entityId: id,
    summary: `Delete user ${deleted.email}`,
  });
  res.json({ success: true, message: 'User deleted' });
});

router.get('/feedback', async (_req: Request, res: Response) => {
  const feedback = await prisma.feedback.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: {
      id: true,
      name: true,
      message: true,
      rating: true,
      isPublished: true,
      createdAt: true,
      userId: true,
    },
  });
  res.json({ success: true, data: feedback });
});

router.patch('/feedback/:id', async (req: Request, res: Response) => {
  const id = paramString(req.params.id);
  const { isPublished } = req.body as { isPublished?: boolean };
  if (typeof isPublished !== 'boolean') {
    res.status(400).json({ success: false, message: 'isPublished (boolean) wajib' });
    return;
  }

  try {
    const updated = await prisma.feedback.update({
      where: { id },
      data: { isPublished },
      select: {
        id: true,
        name: true,
        message: true,
        rating: true,
        isPublished: true,
        createdAt: true,
      },
    });

    const authUser = (req as AuthenticatedRequest).user!;
    await auditService.log({
      userId: authUser.userId,
      actorRole: 'ADMIN',
      action: isPublished ? 'PUBLISH_FEEDBACK' : 'UNPUBLISH_FEEDBACK',
      entityType: 'feedback',
      entityId: id,
      summary: `${isPublished ? 'Publish' : 'Unpublish'} feedback ${id}`,
    });

    res.json({ success: true, data: updated, message: isPublished ? 'Ditampilkan di landing' : 'Disembunyikan dari landing' });
  } catch {
    res.status(404).json({ success: false, message: 'Feedback tidak ditemukan' });
  }
});

router.delete('/feedback/:id', async (req: Request, res: Response) => {
  const id = paramString(req.params.id);
  await prisma.feedback.delete({ where: { id } });
  res.json({ success: true, message: 'Feedback deleted' });
});

// ==================== ADMIN INSIGHTS ====================
router.get('/activity', async (req: Request, res: Response) => {
  const take = Number(req.query.take || 50);
  const safeTake = Number.isFinite(take) ? Math.min(Math.max(take, 1), 200) : 50;

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: safeTake,
    select: {
      id: true,
      userId: true,
      actorRole: true,
      action: true,
      entityType: true,
      entityId: true,
      summary: true,
      createdAt: true,
    },
  });

  res.json({ success: true, data: logs });
});

router.get('/feature-flags', async (_req: Request, res: Response) => {
  await ensureDefaultFeatureFlags();
  const flags = await prisma.featureFlag.findMany({
    orderBy: { label: 'asc' },
    select: { key: true, label: true, description: true, isEnabled: true, updatedAt: true },
  });
  res.json({ success: true, data: flags });
});

router.patch('/feature-flags/:key', async (req: Request, res: Response) => {
  const key = paramString(req.params.key);
  const { isEnabled } = req.body as { isEnabled?: boolean };

  if (typeof isEnabled !== 'boolean') {
    res.status(400).json({ success: false, message: 'isEnabled must be boolean' });
    return;
  }

  const currentAdmin = (req as AuthenticatedRequest).user!;

  let updated;
  try {
    updated = await setFeatureFlag(key, isEnabled, currentAdmin.userId);
  } catch {
    res.status(404).json({ success: false, message: 'Feature flag not found' });
    return;
  }

  void auditService.log({
    userId: currentAdmin.userId,
    actorRole: currentAdmin.role,
    action: 'TOGGLE_FEATURE_FLAG',
    entityType: 'feature_flag',
    entityId: key,
    summary: `Feature flag ${key} -> ${isEnabled ? 'ON' : 'OFF'}`,
    metadata: { isEnabled },
  });

  res.json({ success: true, data: updated });
});

router.get('/traffic', async (req: Request, res: Response) => {
  const days = Number(req.query.days || 7);
  const safeDays = Number.isFinite(days) ? Math.min(Math.max(days, 1), 30) : 7;

  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - safeDays);

  const events = await prisma.visitEvent.findMany({
    where: { createdAt: { gte: start, lte: end } },
    select: { createdAt: true, path: true, sessionId: true },
    orderBy: { createdAt: 'desc' },
    take: 50000,
  });

  const totalVisits = events.length;
  const uniqueSessions = new Set(events.map((e) => e.sessionId));

  // Active "today" (based on sessionId uniqueness)
  const todayStart = new Date(end);
  todayStart.setHours(0, 0, 0, 0);
  const todaySessions = new Set(
    events
      .filter((e) => e.createdAt >= todayStart)
      .map((e) => e.sessionId)
  );

  const pathCounts = new Map<string, number>();
  for (const e of events) {
    const current = pathCounts.get(e.path) ?? 0;
    pathCounts.set(e.path, current + 1);
  }

  const topPaths = Array.from(pathCounts.entries())
    .map(([path, visits]) => ({ path, visits }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 10);

  // Daily buckets (YYYY-MM-DD)
  const dayCounts = new Map<string, number>();
  for (const e of events) {
    const day = e.createdAt.toISOString().slice(0, 10);
    dayCounts.set(day, (dayCounts.get(day) ?? 0) + 1);
  }

  const daily = Array.from(dayCounts.entries())
    .map(([date, visits]) => ({ date, visits }))
    .sort((a, b) => a.date.localeCompare(b.date));

  res.json({
    success: true,
    data: {
      totalVisits,
      uniqueVisitorsInRange: uniqueSessions.size,
      activeUsersToday: todaySessions.size,
      daily,
      topPaths,
    },
  });
});

router.get('/legal', async (_req: Request, res: Response) => {
  const docs = await listLegalDocuments();
  res.json({ success: true, data: docs });
});

router.put('/legal/:key', async (req: Request, res: Response) => {
  const key = paramString(req.params.key);
  if (!['terms', 'privacy'].includes(key)) {
    res.status(404).json({ success: false, message: 'Dokumen tidak ditemukan' });
    return;
  }

  const { title, body } = req.body as { title?: string; body?: string };
  if (title === undefined && body === undefined) {
    res.status(400).json({ success: false, message: 'title atau body wajib diisi' });
    return;
  }

  const currentAdmin = (req as AuthenticatedRequest).user!;

  try {
    const updated = await updateLegalDocument(key, { title, body }, currentAdmin.userId);
    void auditService.log({
      userId: currentAdmin.userId,
      actorRole: currentAdmin.role,
      action: 'UPDATE_LEGAL_DOCUMENT',
      entityType: 'legal_document',
      entityId: key,
      summary: `Update legal document ${key}`,
      metadata: {
        titleLength: updated.title.length,
        bodyLength: updated.body.length,
      },
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    if (message === 'NOT_FOUND') {
      res.status(404).json({ success: false, message: 'Dokumen tidak ditemukan' });
      return;
    }
    if (message === 'TITLE_INVALID') {
      res.status(400).json({ success: false, message: 'Judul minimal 3 karakter' });
      return;
    }
    if (message === 'BODY_INVALID') {
      res.status(400).json({ success: false, message: 'Isi dokumen minimal 20 karakter' });
      return;
    }
    res.status(500).json({ success: false, message: 'Gagal menyimpan dokumen' });
  }
});

router.get('/billing-settings', async (_req: Request, res: Response) => {
  const data = await getBillingSettings();
  res.json({ success: true, data });
});

router.put('/billing-settings', async (req: Request, res: Response) => {
  try {
    const body = req.body ?? {};
    const lifetimePrice =
      typeof body.lifetimePrice === 'number'
        ? body.lifetimePrice
        : typeof body.lifetimePrice === 'string'
          ? parseInt(body.lifetimePrice, 10)
          : undefined;
    const data = await updateBillingSettings({
      lifetimePrice:
        lifetimePrice !== undefined && Number.isFinite(lifetimePrice)
          ? lifetimePrice
          : undefined,
      bankName: typeof body.bankName === 'string' ? body.bankName : undefined,
      bankAccount: typeof body.bankAccount === 'string' ? body.bankAccount : undefined,
      bankHolder: typeof body.bankHolder === 'string' ? body.bankHolder : undefined,
    });
    const admin = (req as AuthenticatedRequest).user!;
    await auditService.log({
      userId: admin.userId,
      actorRole: 'ADMIN',
      action: 'UPDATE_BILLING_SETTINGS',
      entityType: 'app_setting',
      entityId: 'pro_bank',
      summary: 'Update Pro bank / harga settings',
    });
    res.json({ success: true, data, message: 'Pengaturan Pro disimpan' });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Gagal menyimpan';
    res.status(400).json({ success: false, message });
  }
});

router.get('/pro-requests', async (req: Request, res: Response) => {
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const data = await listAdminRequests(status);
  res.json({ success: true, data });
});

router.get('/pro-requests/summary', async (_req: Request, res: Response) => {
  const data = await countOpenProRequests();
  res.json({ success: true, data });
});

router.post('/pro-requests/:id/approve', async (req: Request, res: Response) => {
  try {
    const id = paramString(req.params.id);
    const adminNote =
      typeof req.body?.adminNote === 'string' ? req.body.adminNote.slice(0, 500) : undefined;
    const data = await approveRequest(id, adminNote);
    const admin = (req as AuthenticatedRequest).user!;
    await auditService.log({
      userId: admin.userId,
      actorRole: 'ADMIN',
      action: 'APPROVE_PRO_PURCHASE',
      entityType: 'pro_purchase_request',
      entityId: id,
      summary: `Approve Pro purchase ${id}`,
    });
    res.json({ success: true, data, message: 'Pro diaktifkan' });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Gagal approve';
    res.status(400).json({ success: false, message });
  }
});

router.post('/pro-requests/:id/reject', async (req: Request, res: Response) => {
  try {
    const id = paramString(req.params.id);
    const adminNote =
      typeof req.body?.adminNote === 'string' ? req.body.adminNote.slice(0, 500) : undefined;
    const data = await rejectRequest(id, adminNote);
    const admin = (req as AuthenticatedRequest).user!;
    await auditService.log({
      userId: admin.userId,
      actorRole: 'ADMIN',
      action: 'REJECT_PRO_PURCHASE',
      entityType: 'pro_purchase_request',
      entityId: id,
      summary: `Reject Pro purchase ${id}`,
    });
    res.json({ success: true, data, message: 'Permintaan ditolak' });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Gagal menolak';
    res.status(400).json({ success: false, message });
  }
});

export default router;
