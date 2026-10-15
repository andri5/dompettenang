/**
 * Manual Pro Lifetime billing (bank transfer + admin approve)
 */

import crypto from 'crypto';
import { prisma } from '../utils/prisma.js';
import { config } from '../config/index.js';
import { hasProAccess } from '../utils/plan.js';

const SETTING_KEYS = {
  price: 'pro_lifetime_price',
  bankName: 'pro_bank_name',
  bankAccount: 'pro_bank_account',
  bankHolder: 'pro_bank_holder',
} as const;

function transferCode(userId: string) {
  const short = userId.replace(/-/g, '').slice(0, 6).toUpperCase();
  const rand = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `DT-${short}-${rand}`;
}

async function readSettingsMap() {
  const rows = await prisma.appSetting.findMany({
    where: { key: { in: Object.values(SETTING_KEYS) } },
  });
  return Object.fromEntries(rows.map((r) => [r.key, r.value])) as Record<string, string>;
}

export async function getBillingSettings() {
  const map = await readSettingsMap();
  const priceRaw = map[SETTING_KEYS.price]?.trim();
  const priceFromDb = priceRaw ? parseInt(priceRaw, 10) : NaN;
  const price =
    Number.isFinite(priceFromDb) && priceFromDb > 0
      ? priceFromDb
      : config.billing.lifetimePrice;

  const name = (map[SETTING_KEYS.bankName] || config.billing.bankName || '').trim();
  const account = (map[SETTING_KEYS.bankAccount] || config.billing.bankAccount || '').trim();
  const holder = (map[SETTING_KEYS.bankHolder] || config.billing.bankHolder || '').trim();

  return {
    lifetimePrice: price,
    bankName: name,
    bankAccount: account,
    bankHolder: holder,
    configured: Boolean(name && account && holder),
    source: {
      price: map[SETTING_KEYS.price] ? ('db' as const) : ('env' as const),
      bank:
        map[SETTING_KEYS.bankName] ||
        map[SETTING_KEYS.bankAccount] ||
        map[SETTING_KEYS.bankHolder]
          ? ('db' as const)
          : ('env' as const),
    },
  };
}

export async function updateBillingSettings(input: {
  lifetimePrice?: number;
  bankName?: string;
  bankAccount?: string;
  bankHolder?: string;
}) {
  const ops: Promise<unknown>[] = [];

  if (typeof input.lifetimePrice === 'number' && input.lifetimePrice > 0) {
    ops.push(
      prisma.appSetting.upsert({
        where: { key: SETTING_KEYS.price },
        create: { key: SETTING_KEYS.price, value: String(Math.round(input.lifetimePrice)) },
        update: { value: String(Math.round(input.lifetimePrice)) },
      })
    );
  }
  if (typeof input.bankName === 'string') {
    const value = input.bankName.trim().slice(0, 80);
    ops.push(
      prisma.appSetting.upsert({
        where: { key: SETTING_KEYS.bankName },
        create: { key: SETTING_KEYS.bankName, value },
        update: { value },
      })
    );
  }
  if (typeof input.bankAccount === 'string') {
    const value = input.bankAccount.trim().slice(0, 64);
    ops.push(
      prisma.appSetting.upsert({
        where: { key: SETTING_KEYS.bankAccount },
        create: { key: SETTING_KEYS.bankAccount, value },
        update: { value },
      })
    );
  }
  if (typeof input.bankHolder === 'string') {
    const value = input.bankHolder.trim().slice(0, 120);
    ops.push(
      prisma.appSetting.upsert({
        where: { key: SETTING_KEYS.bankHolder },
        create: { key: SETTING_KEYS.bankHolder, value },
        update: { value },
      })
    );
  }

  if (ops.length === 0) {
    throw new Error('Tidak ada data yang diubah');
  }

  await Promise.all(ops);
  return getBillingSettings();
}

export async function getPublicPlans() {
  const settings = await getBillingSettings();
  return {
    lifetime: {
      id: 'lifetime',
      name: 'Pro Lifetime',
      price: settings.lifetimePrice,
      currency: 'IDR',
      description: 'Sekali bayar — akses Pro selamanya (early bird).',
    },
    bank: {
      name: settings.bankName || null,
      account: settings.bankAccount || null,
      holder: settings.bankHolder || null,
      configured: settings.configured,
    },
  };
}

export async function countOpenProRequests() {
  const [pending, proofSubmitted] = await Promise.all([
    prisma.proPurchaseRequest.count({ where: { status: 'PENDING' } }),
    prisma.proPurchaseRequest.count({ where: { status: 'PROOF_SUBMITTED' } }),
  ]);
  return {
    pending,
    proofSubmitted,
    open: pending + proofSubmitted,
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

  const plans = await getPublicPlans();
  if (!plans.bank.configured) {
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
      amount: plans.lifetime.price,
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
