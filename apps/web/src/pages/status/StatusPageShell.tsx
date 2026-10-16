/**
 * Shared atmospheric shell for status pages (404, maintenance)
 */

import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wallet } from 'lucide-react';
import { ROUTES } from '@/lib/constants';

export function StatusPageShell({
  badge,
  title,
  description,
  icon,
  actions,
}: {
  badge: string;
  title: string;
  description: string;
  icon: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-x-clip px-4 py-10">
      <div className="absolute inset-0 bg-canvas">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,color-mix(in_srgb,var(--color-accent)_22%,transparent),transparent_42%),radial-gradient(circle_at_82%_12%,color-mix(in_srgb,var(--color-accent-bright)_16%,transparent),transparent_38%),radial-gradient(circle_at_70%_88%,color-mix(in_srgb,var(--color-amber)_10%,transparent),transparent_40%)]" />
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              'linear-gradient(color-mix(in_srgb,var(--color-ink)_12%,transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in_srgb,var(--color-ink)_12%,transparent) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <motion.div
          className="absolute -left-20 top-24 h-64 w-64 rounded-full bg-accent/20 blur-3xl"
          animate={{ x: [0, 18, 0], y: [0, -12, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -right-16 bottom-16 h-72 w-72 rounded-full bg-accent-bright/15 blur-3xl"
          animate={{ x: [0, -14, 0], y: [0, 14, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-lg"
      >
        <Link
          to={ROUTES.HOME}
          className="mb-6 inline-flex items-center gap-2.5 rounded-2xl border border-line bg-surface/80 px-3 py-2 backdrop-blur-md transition hover:border-accent/40"
        >
          <span className="brand-mark flex h-9 w-9 items-center justify-center rounded-xl text-ink">
            <Wallet className="h-4 w-4" />
          </span>
          <span className="text-left">
            <span className="block font-display text-base font-bold tracking-[-0.03em] text-ink">
              Dompet Tenang
            </span>
            <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
              Finance OS
            </span>
          </span>
        </Link>

        <div className="rounded-[1.75rem] border border-line bg-surface/95 p-6 shadow-[var(--shadow-soft)] backdrop-blur-md sm:p-8">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent">
            {icon}
          </div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
            {badge}
          </p>
          <h1 className="mt-2 font-display text-2xl font-bold tracking-[-0.03em] text-ink sm:text-3xl">
            {title}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted sm:text-[15px]">{description}</p>
          {actions ? <div className="mt-6 flex flex-wrap gap-2.5">{actions}</div> : null}
        </div>
      </motion.div>
    </div>
  );
}
