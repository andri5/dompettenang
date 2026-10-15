/**
 * Manual Pro Lifetime billing (bank transfer + admin approve)
 */

import crypto from 'crypto';
import { prisma } from '../utils/prisma.js';
import { config } from '../config/index.js';
import { hasProAccess } from '../utils/plan.js';

function transferCode(userId: string) {
  const short = userId.replace(/-/g, '').slice(0, 6).toUpperCase();
  const rand = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `DT-${short}-${rand}`;
}

export function getPublicPlans() {
  return {
    lifetime: {
      id: 'lifetime',
      name: 'Pro Lifetime',
      price: config.billing.lifetimePrice,
      currency: 'IDR',
      description: 'Sekali bayar — akses Pro selamanya (early bird).',
    },
    bank: {
      name: config.billing.bankName || null,
      account: config.billing.bankAccount || null,
      holder: config.billing.bankHolder || null,
      configured: Boolean(
        config.billing.bankName &&
          config.billing.bankAccount &&
          config.billing.bankHolder
      ),
    },
  };
}

export async function createPurchaseRequest(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, plan: true, proExpiresAt: true },
  });
  if (!user) throw new Error('User tidak ditemukan');

  if (hasProAccess(user)) {
    throw new Error('Akun kamu sudah Pro');
  }

  if (!getPublicPlans().bank.configured) {
    throw new Error('Pembayaran Pro belum dikonfigurasi. Hubungi admin.');
  }

  const open = await prisma.proPurchaseRequest.findFirst({
    where: {
      userId,
      status: { in: ['PENDING', 'PROOF_SUBMITTED'] },
    },
    orderBy: { createdAt: 'desc' },
  });
  if (open) {
    return formatRequest(open);
  }

  const created = await prisma.proPurchaseRequest.create({
    data: {
      userId,
      amount: config.billing.lifetimePrice,
      transferNote: transferCode(userId),
      status: 'PENDING',
    },
  });
  return formatRequest(created);
}

export async function listMyRequests(userId: string) {
  const rows = await prisma.proPurchaseRequest.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  return rows.map(formatRequest);
}

export async function submitProof(userId: string, requestId: string, proofPath: string) {
  const row = await prisma.proPurchaseRequest.findFirst({
    where: { id: requestId, userId },
  });
  if (!row) throw new Error('Permintaan tidak ditemukan');
  if (row.status === 'APPROVED') throw new Error('Permintaan sudah disetujui');
  if (row.status === 'REJECTED') throw new Error('Permintaan ditolak. Buat permintaan baru.');

  const updated = await prisma.proPurchaseRequest.update({
    where: { id: row.id },
    data: {
      proofPath,
      status: 'PROOF_SUBMITTED',
    },
  });
  return formatRequest(updated);
}

export async function listAdminRequests(status?: string) {
  const where =
    status && ['PENDING', 'PROOF_SUBMITTED', 'APPROVED', 'REJECTED'].includes(status)
      ? { status: status as 'PENDING' | 'PROOF_SUBMITTED' | 'APPROVED' | 'REJECTED' }
      : {};

  const rows = await prisma.proPurchaseRequest.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return rows.map((r) => ({
    ...formatRequest(r),
    user: r.user,
  }));
}

export async function approveRequest(requestId: string, adminNote?: string) {
  const row = await prisma.proPurchaseRequest.findUnique({ where: { id: requestId } });
  if (!row) throw new Error('Permintaan tidak ditemukan');
  if (row.status === 'APPROVED') return formatRequest(row);

  const [, updated] = await prisma.$transaction([
    prisma.user.update({
      where: { id: row.userId },
      data: { plan: 'PRO', proExpiresAt: null },
    }),
    prisma.proPurchaseRequest.update({
      where: { id: row.id },
      data: {
        status: 'APPROVED',
        adminNote: adminNote || null,
        reviewedAt: new Date(),
      },
    }),
  ]);

  return formatRequest(updated);
}

export async function rejectRequest(requestId: string, adminNote?: string) {
  const row = await prisma.proPurchaseRequest.findUnique({ where: { id: requestId } });
  if (!row) throw new Error('Permintaan tidak ditemukan');
  if (row.status === 'APPROVED') throw new Error('Tidak bisa menolak yang sudah disetujui');

  const updated = await prisma.proPurchaseRequest.update({
    where: { id: row.id },
    data: {
      status: 'REJECTED',
      adminNote: adminNote || null,
      reviewedAt: new Date(),
    },
  });
  return formatRequest(updated);
}

function formatRequest(row: {
  id: string;
  userId: string;
  amount: number;
  transferNote: string;
  status: string;
  proofPath: string | null;
  adminNote: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    userId: row.userId,
    amount: row.amount,
    transferNote: row.transferNote,
    status: row.status,
    proofPath: row.proofPath,
    adminNote: row.adminNote,
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
