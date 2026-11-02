/**
 * Public guide: how to record monthly expenses.
 */

import { Link } from 'react-router-dom';
import { ArrowRight, Wallet } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { ROUTES } from '@/lib/constants';
import { SITE_URL } from '@/lib/site';
import { useAuthStore } from '@/stores';

const PAGE_PATH = '/cara-catat-pengeluaran-bulanan';

const STEPS = [
  {
    title: 'Buat akun gratis',
    body: 'Isi nama, email, dan password. Jenis kelamin dan tanggal lahir tidak wajib saat daftar. Akun langsung bisa dipakai.',
  },
  {
    title: 'Catat pemasukan bulan ini',
    body: 'Masukkan gaji atau uang lain yang masuk. Isi nominal, tanggal, dan kategori. Satu pemasukan cukup untuk melihat perbandingan dengan pengeluaran.',
  },
  {
    title: 'Catat pengeluaran setiap kali belanja',
    body: 'Isi nominal, catatan singkat, tanggal, dan kategori. Foto struk boleh dilampirkan, tetapi tidak wajib. Makin dekat dengan hari belanjanya, makin mudah diingat.',
  },
  {
    title: 'Lihat sisa di dashboard',
    body: 'Pilih periode Bulan. Dashboard menampilkan pemasukan, pengeluaran, dan sisa untuk bulan yang sedang berjalan.',
  },
  {
    title: 'Pasang batas budget',
    body: 'Budget bulanan gratis. Tentukan batas pengeluaran, misalnya untuk makan, lalu pantau pemakaiannya dari dashboard.',
  },
];

export function MonthlyExpenseGuidePage() {
  const isLoggedIn = useAuthStore((s) => !!s.user);
  const ctaTo = isLoggedIn ? ROUTES.DASHBOARD : ROUTES.REGISTER;
  const ctaLabel = isLoggedIn ? 'Buka Dashboard' : 'Daftar gratis';

  return (
    <div className="min-h-dvh bg-[#0a1628] text-white">
      <SEO
        title="Cara Catat Pengeluaran Bulanan"
        description="Cara catat pengeluaran bulanan: daftar gratis, catat pemasukan dan belanja, lalu lihat sisa uang bulan ini di Dompet Tenang."
        keywords="cara catat pengeluaran bulanan, catat pemasukan, pencatatan keuangan pribadi, budget bulanan, Dompet Tenang"
        canonical={PAGE_PATH}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'HowTo',
          name: 'Cara catat pengeluaran bulanan',
          description:
            'Catat pemasukan dan pengeluaran sebulan, lalu lihat sisa uangnya di dashboard.',
          inLanguage: 'id-ID',
          url: `${SITE_URL}${PAGE_PATH}`,
          step: STEPS.map((step, index) => ({
            '@type': 'HowToStep',
            position: index + 1,
            name: step.title,
            text: step.body,
          })),
        }}
      />
      <header className="border-b border-white/[0.06]">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4 sm:h-16 sm:px-5">
          <Link to={ROUTES.HOME} className="flex items-center gap-2 font-display font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent">
              <Wallet className="h-4 w-4 text-white" />
            </span>
            Dompet Tenang
          </Link>
          <Link to={ctaTo} className="text-sm font-semibold text-accent">
            {ctaLabel}
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-5 sm:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Panduan</p>
        <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight sm:text-5xl">
          Cara catat pengeluaran bulanan
        </h1>
        <p className="mt-5 text-base leading-relaxed text-white/70 sm:text-lg">
          Catat uang yang masuk dan uang yang keluar dalam satu bulan, lalu lihat sisanya.
          Dompet Tenang bisa dipakai gratis untuk pencatatan, dashboard, dan budget.
        </p>
        <ol className="mt-10 space-y-6">
          {STEPS.map((step, index) => (
            <li key={step.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-xs font-semibold text-accent">Langkah {index + 1}</p>
              <h2 className="mt-1 font-display text-xl font-bold">{step.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/70">{step.body}</p>
            </li>
          ))}
        </ol>
        <div className="mt-10">
          <Link
            to={ctaTo}
            className="inline-flex items-center gap-2 rounded-2xl bg-accent px-6 py-3 text-sm font-bold text-white"
          >
            {ctaLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}
