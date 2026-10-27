/**
 * One-time Pro welcome splash + feature tour after plan becomes PRO.
 */

import { ROUTES } from '@/lib/constants';

const SEEN_PREFIX = 'dt_pro_welcome_seen_';

export const PRO_WELCOME_SPLASH = {
  title: 'Selamat datang di Pro',
  message:
    'Akunmu sudah Dompet Tenang Pro Lifetime. Yuk kenalan singkat dengan fitur yang baru terbuka.',
  confirmLabel: 'Mulai panduan',
  skipLabel: 'Lewati',
} as const;

export type ProWelcomeStep = {
  id: string;
  title: string;
  message: string;
  ctaLabel: string;
  /** Optional deep-link after this step (or after finishing tour). */
  href?: string;
};

export const PRO_WELCOME_STEPS: ProWelcomeStep[] = [
  {
    id: 'budget-alert',
    title: 'Peringatan budget',
    message:
      'Di Dashboard, kamu dapat pemberitahuan saat budget total atau kategori mencapai 80% dan 100%. Notifikasi browser dikirim sekali untuk tiap ambang batas dalam sebulan.',
    ctaLabel: 'Lanjut',
    href: ROUTES.DASHBOARD,
  },
  {
    id: 'insight',
    title: 'Insight bulanan',
    message:
      'Di Dashboard, lihat pengeluaran bulan ini dibanding periode yang sama bulan lalu, plus kategori terbesar dan saran singkat.',
    ctaLabel: 'Lanjut',
    href: ROUTES.DASHBOARD,
  },
  {
    id: 'pdf',
    title: 'Export laporan PDF',
    message:
      'Dari Dashboard, unduh ringkasan keuangan dalam format PDF — cocok untuk arsip atau laporan.',
    ctaLabel: 'Lanjut',
    href: ROUTES.DASHBOARD,
  },
  {
    id: 'share',
    title: 'Bagikan ringkasan',
    message:
      'Di aplikasi mobile, bagikan ringkasan ke orang terdekat tanpa harus screenshot manual.',
    ctaLabel: 'Lanjut',
  },
  {
    id: 'recurring',
    title: 'Transaksi otomatis',
    message:
      'Atur pemasukan atau pengeluaran berulang (gaji, langganan) supaya tercatat sendiri setiap periode.',
    ctaLabel: 'Lanjut',
    href: ROUTES.RECURRING,
  },
  {
    id: 'savings',
    title: 'Target tabungan',
    message:
      'Buat target (misalnya dana darurat), catat setoran, dan pantau progres sampai tercapai.',
    ctaLabel: 'Mulai pakai Pro',
    href: ROUTES.SAVINGS,
  },
];

export function hasSeenProWelcome(userId?: string | null): boolean {
  if (!userId) return false;
  try {
    return localStorage.getItem(`${SEEN_PREFIX}${userId}`) === '1';
  } catch {
    return false;
  }
}

export function markProWelcomeSeen(userId?: string | null): void {
  if (!userId) return;
  try {
    localStorage.setItem(`${SEEN_PREFIX}${userId}`, '1');
  } catch {
    /* ignore */
  }
}

/** True when user plan is PRO and welcome tour has not been completed. */
export function shouldOfferProWelcome(user: {
  id?: string;
  plan?: string | null;
} | null | undefined): boolean {
  if (!user?.id) return false;
  if (user.plan !== 'PRO') return false;
  return !hasSeenProWelcome(user.id);
}
