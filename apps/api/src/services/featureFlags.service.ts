import { prisma } from '../utils/prisma.js';

export type FeatureFlagKey =
  | 'market_widget'
  | 'savings_goals'
  | 'recurring_transactions'
  | 'feedback_form'
  | 'budget_alerts'
  | 'admin_panel'
  | 'captcha_auth';

const DEFAULT_FLAGS: Array<{
  key: FeatureFlagKey;
  label: string;
  description?: string;
  isEnabled?: boolean;
}> = [
  {
    key: 'market_widget',
    label: 'Market Widget',
    description: 'Tampilkan kartu widget market rate di dashboard.',
    isEnabled: true,
  },
  {
    key: 'savings_goals',
    label: 'Target Tabungan',
    description: 'Aktifkan menu dan fitur target tabungan (Savings).',
    isEnabled: true,
  },
  {
    key: 'recurring_transactions',
    label: 'Transaksi Otomatis',
    description: 'Aktifkan fitur transaksi berulang (P3 foundation).',
    isEnabled: true,
  },
  {
    key: 'feedback_form',
    label: 'Form Feedback',
    description: 'Aktifkan form saran/feedback user di mobile & web.',
    isEnabled: true,
  },
  {
    key: 'budget_alerts',
    label: 'Budget Alerts',
    description: 'Aktifkan notifikasi alert terkait budget.',
    isEnabled: true,
  },
  {
    key: 'admin_panel',
    label: 'Admin Panel',
    description: 'Aktifkan dashboard panel admin.',
    isEnabled: true,
  },
  {
    key: 'captcha_auth',
    label: 'Captcha Auth (Turnstile)',
    description:
      'Wajibkan Cloudflare Turnstile di login, register & lupa password. Default OFF untuk lokal.',
    isEnabled: false,
  },
];

export async function ensureDefaultFeatureFlags() {
  for (const flag of DEFAULT_FLAGS) {
    await prisma.featureFlag.upsert({
      where: { key: flag.key },
      create: {
        key: flag.key,
        label: flag.label,
        description: flag.description,
        isEnabled: flag.isEnabled ?? true,
      },
      update: {
        label: flag.label,
        description: flag.description,
      },
    });
  }
}

export async function getFeatureFlags() {
  await ensureDefaultFeatureFlags();
  return prisma.featureFlag.findMany({
    orderBy: { label: 'asc' },
    select: { key: true, label: true, description: true, isEnabled: true, updatedAt: true },
  });
}

export async function setFeatureFlag(key: string, isEnabled: boolean, updatedById?: string) {
  await ensureDefaultFeatureFlags();
  return prisma.featureFlag.update({
    where: { key },
    data: { isEnabled, updatedById: updatedById ?? null },
    select: { key: true, label: true, isEnabled: true, updatedAt: true },
  });
}

export async function isFeatureEnabled(key: FeatureFlagKey): Promise<boolean> {
  await ensureDefaultFeatureFlags();
  const flag = await prisma.featureFlag.findUnique({
    where: { key },
    select: { isEnabled: true },
  });
  return flag?.isEnabled ?? false;
}

