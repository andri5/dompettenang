/**
 * Dompet Tenang - Landing Page
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, type Variants } from 'framer-motion';
import {
  MessageSquarePlus,
  Star,
  Send,
  Wallet,
  Receipt,
  PiggyBank,
  Target,
  Camera,
  Shield,
  Smartphone,
  ArrowRight,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Zap,
  CheckCircle2,
  Crown,
  FileSpreadsheet,
  FileText,
  Share2,
} from 'lucide-react';
import { ROUTES } from '@/lib/constants';
import {
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
} from '@/lib/site';
import { useAuthStore } from '@/stores';
import { SEO } from '@/components/SEO';
import api from '@/lib/api';
import { feedbackSchema } from '@/lib/validations';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  }),
};

const FEATURES = [
  {
    icon: Receipt,
    title: 'Catat Transaksi',
    desc: 'Pemasukan & pengeluaran tercatat rapi dalam satu tempat.',
    tone: 'bg-accent-soft text-accent',
    tier: 'free' as const,
  },
  {
    icon: PiggyBank,
    title: 'Budget Bulanan',
    desc: 'Atur limit pengeluaran dan pantau biar tetap on-track.',
    tone: 'bg-violet-100 text-violet-600',
    tier: 'free' as const,
  },
  {
    icon: Sparkles,
    title: 'Insight Bulanan',
    desc: 'Bandingkan bulan ini dengan bulan lalu, plus saran singkat.',
    tone: 'bg-accent-soft text-accent',
    tier: 'pro' as const,
  },
  {
    icon: Target,
    title: 'Target Tabungan',
    desc: 'Set goal saving dan lihat progresmu naik terus.',
    tone: 'bg-amber-100 text-amber-600',
    tier: 'pro' as const,
  },
  {
    icon: Camera,
    title: 'Foto Struk',
    desc: 'Lampirkan foto/PDF struk di transaksi (opsional).',
    tone: 'bg-lime-100 text-lime-600',
    tier: 'free' as const,
  },
  {
    icon: FileSpreadsheet,
    title: 'Export Excel',
    desc: 'Unduh ringkasan + daftar transaksi kapan saja — gratis.',
    tone: 'bg-cyan-100 text-cyan-600',
    tier: 'free' as const,
  },
  {
    icon: Shield,
    title: 'Aman & Privat',
    desc: 'Data keuanganmu terenkripsi dan hanya kamu yang akses.',
    tone: 'bg-rose-100 text-rose-500',
    tier: 'free' as const,
  },
];

const FREE_PLAN_ITEMS = [
  'Catat pemasukan & pengeluaran',
  'Dashboard & grafik ringkasan',
  'Budget bulanan',
  'Upload struk',
  'Export Excel',
  'Tema & profil',
];

const PRO_PLAN_ITEMS = [
  'Semua fitur Free',
  'Target tabungan',
  'Transaksi otomatis',
  'Insight bulanan',
  'Export laporan PDF',
  'Bagikan ringkasan dari mobile',
  'Sekali bayar — lifetime',
];

type LandingTestimonial = {
  id: string;
  name: string;
  role: string;
  gender: string | null;
  text: string;
  stars: number;
};

const STEPS = [
  { num: '01', title: 'Daftar gratis', desc: 'Buat akun dalam hitungan detik.' },
  { num: '02', title: 'Catat keuangan', desc: 'Pemasukan, pengeluaran, dan target saving.' },
  { num: '03', title: 'Pantau & kontrol', desc: 'Dashboard real-time, budget alerts, dan laporan.' },
];

export function LandingPage() {
  const isLoggedIn = useAuthStore((s) => !!s.user);
  const { data: testimonials = [], isLoading: testimonialsLoading } = useQuery({
    queryKey: ['landing', 'testimonials'],
    queryFn: async () => {
      const res = await api.get('/feedback/testimonials');
      return (res.data.data ?? []) as LandingTestimonial[];
    },
    staleTime: 60_000,
  });

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL,
      inLanguage: 'id-ID',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
      logo: absoluteUrl('/favicon.svg'),
      description:
        'Aplikasi pencatatan keuangan pribadi untuk mengelola pemasukan, pengeluaran, budget, dan target tabungan.',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: SITE_NAME,
      url: SITE_URL,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      inLanguage: 'id-ID',
      offers: [
        {
          '@type': 'Offer',
          name: 'Free',
          price: '0',
          priceCurrency: 'IDR',
        },
        {
          '@type': 'Offer',
          name: 'Pro Lifetime',
          price: '29000',
          priceCurrency: 'IDR',
          description: 'Export PDF dan bagikan laporan — sekali bayar.',
        },
      ],
      description:
        'Catat pemasukan & pengeluaran, atur budget bulanan, dan pantau target tabungan. Gratis, dengan Pro Lifetime opsional.',
    },
  ];

  return (
    <div className="min-h-dvh bg-[#0a1628] text-white selection:bg-accent/30">
      <SEO
        title="Catat Keuangan Pribadi Gratis"
        description="Dompet Tenang — pencatatan keuangan gratis (transaksi, budget, tabungan, export Excel). Pro Lifetime opsional untuk Export PDF & bagikan laporan."
        keywords="aplikasi keuangan gratis, catat pengeluaran, pencatatan keuangan pribadi, budget bulanan, target tabungan, Dompet Tenang Pro, export PDF, expense tracker Indonesia"
        canonical="/"
        jsonLd={jsonLd}
      />
      {/* ---- NAV ---- */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0a1628]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-5">
          <Link to="/" className="flex min-w-0 items-center gap-2 sm:gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-[#5eead4] shadow-lg shadow-accent/25 sm:h-9 sm:w-9">
              <Wallet className="h-4 w-4 text-white sm:h-4.5 sm:w-4.5" />
            </div>
            <span className="truncate font-display text-base font-bold tracking-tight sm:text-lg">
              Dompet Tenang
            </span>
          </Link>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            {isLoggedIn ? (
              <Link
                to={ROUTES.DASHBOARD}
                className="rounded-xl bg-accent px-3 py-2 text-xs font-bold text-white shadow-lg shadow-accent/25 transition hover:bg-accent/90 sm:px-5 sm:py-2.5 sm:text-sm"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to={ROUTES.LOGIN}
                  className="rounded-xl px-2.5 py-2 text-xs font-semibold text-white/70 transition hover:text-white sm:px-4 sm:py-2.5 sm:text-sm"
                >
                  Masuk
                </Link>
                <Link
                  to={ROUTES.REGISTER}
                  className="rounded-xl bg-accent px-3 py-2 text-xs font-bold text-white shadow-lg shadow-accent/25 transition hover:bg-accent/90 sm:px-5 sm:py-2.5 sm:text-sm"
                >
                  Daftar
                  <span className="hidden sm:inline"> Gratis</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ---- HERO ---- */}
      <section className="relative overflow-hidden pb-20 pt-20 sm:pb-28 sm:pt-28 lg:pb-36 lg:pt-32">
        {/* ambient blobs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 top-16 h-[420px] w-[420px] rounded-full bg-accent/20 blur-[120px]" />
          <div className="absolute -right-24 top-48 h-[340px] w-[340px] rounded-full bg-[#5eead4]/15 blur-[100px]" />
          <div className="absolute bottom-0 left-1/2 h-[260px] w-[520px] -translate-x-1/2 rounded-full bg-accent/10 blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 sm:px-5">
          <motion.div
            className="mx-auto max-w-3xl text-center"
            initial="hidden"
            animate="visible"
          >
            <motion.div
              variants={fadeUp}
              custom={0}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1.5 text-[11px] font-semibold text-accent sm:px-4 sm:text-xs"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Gratis untuk mulai · Pro Lifetime opsional
            </motion.div>

            <motion.h1
              variants={fadeUp}
              custom={1}
              className="font-display text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl"
            >
              Kelola keuangan,{' '}
              <span className="bg-gradient-to-r from-accent via-[#5eead4] to-accent bg-clip-text text-transparent">
                raih tujuanmu
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              custom={2}
              className="mx-auto mt-6 max-w-xl text-base text-white/60 sm:text-lg"
            >
              Catat transaksi, budget, dan export Excel gratis. Upgrade Pro untuk tabungan,
              transaksi otomatis, Export PDF, dan bagikan laporan.
            </motion.p>

            <motion.div
              variants={fadeUp}
              custom={3}
              className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
            >
              <Link
                to={isLoggedIn ? ROUTES.DASHBOARD : ROUTES.REGISTER}
                className="group flex items-center gap-2 rounded-2xl bg-gradient-to-r from-accent to-[#1cc8b4] px-8 py-4 text-base font-bold text-white shadow-xl shadow-accent/30 transition hover:shadow-2xl hover:shadow-accent/40"
              >
                {isLoggedIn ? 'Buka Dashboard' : 'Mulai Sekarang'}
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </Link>
              <Link
                to="#fitur"
                className="flex items-center gap-1.5 rounded-2xl border border-white/10 px-6 py-4 text-sm font-semibold text-white/70 transition hover:border-white/20 hover:text-white"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('fitur')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Lihat Fitur
                <ChevronRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </motion.div>

          {/* Hero visual — dashboard preview card */}
          <motion.div
            variants={fadeUp}
            custom={5}
            initial="hidden"
            animate="visible"
            className="relative mx-auto mt-16 max-w-4xl"
          >
            <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.06] to-transparent p-1 shadow-2xl shadow-black/40">
              <div className="rounded-[1.25rem] bg-[#0d1520] p-6 sm:p-8">
                {/* mock dashboard */}
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white/40">Total Saldo</p>
                    <p className="font-display text-2xl font-bold text-white sm:text-3xl">
                      Rp 12.450.000
                    </p>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-lime-500/15 px-3 py-1.5 text-xs font-bold text-lime-400">
                    <TrendingUp className="h-3.5 w-3.5" />
                    +18.3%
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Pemasukan', value: 'Rp 8.200.000', color: 'text-accent' },
                    { label: 'Pengeluaran', value: 'Rp 4.750.000', color: 'text-rose-400' },
                    { label: 'Tabungan', value: 'Rp 3.000.000', color: 'text-amber-400' },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3 sm:p-4"
                    >
                      <p className="text-[10px] text-white/40 sm:text-xs">{s.label}</p>
                      <p className={`mt-1 text-sm font-bold sm:text-base ${s.color}`}>
                        {s.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ---- FEATURES ---- */}
      <section id="fitur" className="relative py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-5">
          <motion.div
            className="mb-14 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
          >
            <motion.p
              variants={fadeUp}
              custom={0}
              className="mb-3 text-xs font-bold uppercase tracking-widest text-accent"
            >
              Fitur Free
            </motion.p>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className="font-display text-3xl font-extrabold sm:text-4xl"
            >
              Inti pencatatan, gratis
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="mx-auto mt-4 max-w-lg text-white/50">
              Catat, budget, dan export Excel gratis. Target tabungan, transaksi otomatis, PDF &
              bagikan laporan ada di Pro.
            </motion.p>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-40px' }}
                className="group rounded-3xl border border-white/[0.06] bg-white/[0.03] p-6 transition hover:border-accent/20 hover:bg-white/[0.05]"
              >
                <div className="mb-4 flex items-start justify-between gap-2">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl ${f.tone}`}
                  >
                    <f.icon className="h-5 w-5" />
                  </div>
                  <span
                    className={
                      f.tier === 'pro'
                        ? 'rounded-full border border-amber-400/40 bg-amber-400/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-300'
                        : 'rounded-full border border-accent/25 bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent'
                    }
                  >
                    {f.tier === 'pro' ? 'Pro' : 'Free'}
                  </span>
                </div>
                <h3 className="mb-1.5 font-display text-base font-bold">{f.title}</h3>
                <p className="text-sm leading-relaxed text-white/50">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- FREE VS PRO ---- */}
      <section id="harga" className="relative py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-5">
          <motion.div
            className="mb-14 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
          >
            <motion.p
              variants={fadeUp}
              custom={0}
              className="mb-3 text-xs font-bold uppercase tracking-widest text-accent"
            >
              Harga
            </motion.p>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className="font-display text-3xl font-extrabold sm:text-4xl"
            >
              Free cukup · Pro opsional
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="mx-auto mt-4 max-w-lg text-white/50">
              Mulai gratis (termasuk budget). Upgrade Pro untuk tabungan, otomatis, PDF & bagikan
              laporan.
            </motion.p>
          </motion.div>

          <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2">
            <motion.div
              variants={fadeUp}
              custom={0}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
              className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-6 sm:p-8"
            >
              <p className="text-xs font-bold uppercase tracking-widest text-white/40">Free</p>
              <p className="mt-2 font-display text-3xl font-extrabold">Rp 0</p>
              <p className="mt-1 text-sm text-white/50">Selamanya · tanpa iklan</p>
              <ul className="mt-6 space-y-2.5">
                {FREE_PLAN_ITEMS.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-white/70">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                to={isLoggedIn ? ROUTES.DASHBOARD : ROUTES.REGISTER}
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 px-4 py-3 text-sm font-bold text-white transition hover:border-white/30 hover:bg-white/5"
              >
                {isLoggedIn ? 'Buka Dashboard' : 'Daftar gratis'}
              </Link>
            </motion.div>

            <motion.div
              variants={fadeUp}
              custom={1}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
              className="relative rounded-3xl border border-accent/30 bg-gradient-to-b from-accent/15 to-white/[0.03] p-6 sm:p-8"
            >
              <div className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[10px] font-bold text-white">
                <Crown className="h-3 w-3" />
                Early bird
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-accent">Pro Lifetime</p>
              <p className="mt-2 font-display text-3xl font-extrabold">Rp 29.000</p>
              <p className="mt-1 text-sm text-white/50">Sekali bayar · akses seumur hidup</p>
              <ul className="mt-6 space-y-2.5">
                {PRO_PLAN_ITEMS.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-white/70">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-white/45">
                <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1">
                  <Target className="h-3 w-3" /> Tabungan
                </span>
                <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1">
                  <FileText className="h-3 w-3" /> Export PDF
                </span>
                <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1">
                  <Share2 className="h-3 w-3" /> Bagikan
                </span>
              </div>
              <Link
                to={isLoggedIn ? ROUTES.UPGRADE : ROUTES.REGISTER}
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-accent to-[#1cc8b4] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-accent/25 transition hover:brightness-105"
              >
                {isLoggedIn ? 'Upgrade Pro' : 'Daftar, lalu Upgrade'}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ---- HOW IT WORKS ---- */}
      <section className="relative py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-5">
          <motion.div
            className="mb-14 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
          >
            <motion.p
              variants={fadeUp}
              custom={0}
              className="mb-3 text-xs font-bold uppercase tracking-widest text-accent"
            >
              Cara Kerja
            </motion.p>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className="font-display text-3xl font-extrabold sm:text-4xl"
            >
              Tiga langkah simpel
            </motion.h2>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.num}
                variants={fadeUp}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-40px' }}
                className="relative rounded-3xl border border-white/[0.06] bg-white/[0.03] p-6 text-center"
              >
                <span className="font-display text-4xl font-black text-accent/20">{s.num}</span>
                <h3 className="mt-2 font-display text-lg font-bold">{s.title}</h3>
                <p className="mt-2 text-sm text-white/50">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- HIGHLIGHTS ---- */}
      <section className="relative py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-5">
          <div className="overflow-hidden rounded-3xl border border-accent/15 bg-gradient-to-br from-accent/10 via-transparent to-[#5eead4]/10 p-8 sm:p-12">
            <div className="grid items-center gap-8 lg:grid-cols-2">
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-accent">
                  Kenapa Dompet Tenang?
                </p>
                <h2 className="font-display text-3xl font-extrabold sm:text-4xl">
                  Dibuat untuk semua orang
                </h2>
                <div className="mt-8 space-y-4">
                  {[
                    'Gratis tanpa iklan untuk fitur inti',
                    'Tampilan modern & responsif',
                    'Aplikasi mobile akan segera rilis',
                    'Data terenkripsi & privat',
                    'Budget alerts otomatis',
                    'Export Excel gratis · PDF di Pro',
                  ].map((t) => (
                    <div key={t} className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-accent" />
                      <span className="text-sm text-white/70">{t}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute -inset-4 rounded-3xl bg-accent/10 blur-2xl" />
                  <div className="relative flex h-64 w-56 items-center justify-center rounded-3xl border border-white/10 bg-[#0d1520] shadow-2xl">
                    <div className="text-center">
                      <Smartphone className="mx-auto h-12 w-12 text-accent/60" />
                      <p className="mt-3 text-xs text-white/40">Mobile App</p>
                      <p className="mt-1 font-display text-sm font-bold">Dompet Tenang</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---- TESTIMONIALS (admin-published feedback) ---- */}
      {(testimonialsLoading || testimonials.length > 0) && (
      <section className="relative py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-5">
          <motion.div
            className="mb-14 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
          >
            <motion.p
              variants={fadeUp}
              custom={0}
              className="mb-3 text-xs font-bold uppercase tracking-widest text-accent"
            >
              Apa Kata Mereka
            </motion.p>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className="font-display text-3xl font-extrabold sm:text-4xl"
            >
              Dipercaya pengguna
            </motion.h2>
          </motion.div>

          {testimonialsLoading ? (
            <p className="text-center text-sm text-white/40">Memuat testimoni…</p>
          ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.id}
                variants={fadeUp}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-40px' }}
                className="rounded-3xl border border-white/[0.06] bg-white/[0.03] p-4 sm:p-5"
              >
                <div className="mb-3 flex gap-0.5">
                  {Array.from({ length: Math.max(0, Math.min(5, t.stars)) }).map((_, j) => (
                    <Star key={j} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  ))}
                  {Array.from({ length: Math.max(0, 5 - t.stars) }).map((_, j) => (
                    <Star key={j} className="h-3.5 w-3.5 text-white/15" />
                  ))}
                </div>
                <p className="mb-4 text-sm leading-relaxed text-white/60">"{t.text}"</p>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{t.name}</p>
                    <p className="text-xs text-white/40">{t.role}</p>
                  </div>
                  {t.gender ? (
                    <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-white/55">
                      {t.gender}
                    </span>
                  ) : null}
                </div>
              </motion.div>
            ))}
          </div>
          )}
        </div>
      </section>
      )}

      {/* ---- FEEDBACK FORM ---- */}
      <FeedbackSection />

      {/* ---- MOBILE COMING SOON ---- */}
      <section id="mobile" className="relative py-20 sm:py-28">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute right-0 top-10 h-[280px] w-[280px] rounded-full bg-[#5eead4]/10 blur-[100px]" />
        </div>
        <div className="relative mx-auto max-w-2xl px-4 text-center sm:px-5">
          <Smartphone className="mx-auto mb-5 h-10 w-10 text-accent" />
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl">
            Aplikasi mobile
          </h2>
          <p className="mx-auto mt-4 max-w-md text-white/50">
            Versi Android &amp; iOS akan segera rilis. Sementara ini, gunakan Dompet Tenang lewat
            browser di HP atau desktop.
          </p>
        </div>
      </section>

      {/* ---- CTA ---- */}
      <section className="relative py-20 sm:py-28">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[300px] w-[600px] -translate-x-1/2 rounded-full bg-accent/15 blur-[120px]" />
        </div>
        <div className="relative mx-auto max-w-2xl px-4 sm:px-5 text-center">
          <Zap className="mx-auto mb-5 h-10 w-10 text-accent" />
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl">
            Mulai kelola keuanganmu
          </h2>
          <p className="mx-auto mt-4 max-w-md text-white/50">
            Gabung sekarang dan rasakan kemudahan mencatat keuangan dalam satu ruang.
          </p>
          <div className="mt-10">
            <Link
              to={isLoggedIn ? ROUTES.DASHBOARD : ROUTES.REGISTER}
              className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-accent to-[#1cc8b4] px-10 py-4 text-base font-bold text-white shadow-xl shadow-accent/30 transition hover:shadow-2xl hover:shadow-accent/40"
            >
              {isLoggedIn ? 'Buka Dashboard' : 'Daftar Gratis'}
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* ---- FOOTER ---- */}
      <footer className="border-t border-white/[0.06] py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 sm:flex-row">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-accent" />
            <span className="text-sm font-semibold text-white/70">Dompet Tenang</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-white/40">
            <a href="#harga" className="transition hover:text-white/70">
              Free & Pro
            </a>
            <a href="#mobile" className="transition hover:text-white/70">
              Mobile segera rilis
            </a>
            <Link to={ROUTES.TERMS} className="transition hover:text-white/70">
              Syarat & Ketentuan
            </Link>
            <Link to={ROUTES.PRIVACY} className="transition hover:text-white/70">
              Kebijakan Privasi
            </Link>
            <Link to={ROUTES.HELP} className="transition hover:text-white/70">
              Bantuan
            </Link>
          </div>
          <p className="text-xs text-white/30">
            &copy; {new Date().getFullYear()} Dompet Tenang
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeedbackSection() {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const checked = feedbackSchema.safeParse({
      name: name || undefined,
      message,
      rating,
    });
    if (!checked.success) return;
    api
      .post('/feedback', {
        name: checked.data.name || null,
        message: checked.data.message,
        rating: checked.data.rating ?? rating,
      })
      .catch(() => {});
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setName('');
      setMessage('');
      setRating(0);
    }, 3000);
  };

  return (
    <section className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-2xl px-4 sm:px-5">
        <motion.div
          className="mb-10 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
        >
          <motion.p
            variants={fadeUp}
            custom={0}
            className="mb-3 text-xs font-bold uppercase tracking-widest text-accent"
          >
            Saran & Masukan
          </motion.p>
          <motion.h2
            variants={fadeUp}
            custom={1}
            className="font-display text-3xl font-extrabold sm:text-4xl"
          >
            Bantu kami jadi lebih baik
          </motion.h2>
          <motion.p variants={fadeUp} custom={2} className="mx-auto mt-4 max-w-md text-white/50">
            Pendapatmu sangat berarti untuk pengembangan Dompet Tenang. Masukan pilihan bisa
            ditampilkan sebagai testimoni di halaman ini (setelah disetujui admin).
          </motion.p>
        </motion.div>

        <motion.form
          variants={fadeUp}
          custom={3}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          onSubmit={handleSubmit}
          className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-6 sm:p-8"
        >
          {submitted ? (
            <div className="py-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/15">
                <CheckCircle2 className="h-7 w-7 text-accent" />
              </div>
              <p className="font-display text-lg font-bold">Terima kasih!</p>
              <p className="mt-1 text-sm text-white/50">Masukan kamu sudah kami terima.</p>
            </div>
          ) : (
            <>
              {/* Star rating */}
              <div className="mb-5">
                <label className="mb-2 block text-xs font-semibold text-white/50">
                  Beri penilaian
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onMouseEnter={() => setHoverRating(v)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(v)}
                      className="rounded-lg p-1 transition hover:scale-110"
                    >
                      <Star
                        className={`h-6 w-6 transition ${
                          v <= (hoverRating || rating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-white/15'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="mb-2 block text-xs font-semibold text-white/50">
                  Nama (opsional)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama kamu"
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-accent/40 focus:bg-white/[0.06]"
                />
              </div>

              <div className="mb-5">
                <label className="mb-2 block text-xs font-semibold text-white/50">
                  Saran atau masukan
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tulis saran, kritik, atau fitur yang kamu harapkan..."
                  rows={4}
                  className="w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-accent/40 focus:bg-white/[0.06]"
                  required
                />
              </div>

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent to-[#1cc8b4] py-3 text-sm font-bold text-white shadow-lg shadow-accent/25 transition hover:shadow-accent/35"
              >
                <Send className="h-4 w-4" />
                Kirim Masukan
              </button>
            </>
          )}
        </motion.form>
      </div>
    </section>
  );
}
