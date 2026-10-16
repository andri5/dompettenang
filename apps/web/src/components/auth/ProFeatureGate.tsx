/**
 * Show children for Pro users; free users see a soft upgrade teaser.
 */

import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Crown } from 'lucide-react';
import { MainLayout, PageHeader, PageTransition } from '@/components/layout';
import { Card } from '@/components/ui';
import { useAuthStore } from '@/stores';
import { hasProAccess } from '@/lib/plan';
import { ROUTES } from '@/lib/constants';

interface ProFeatureGateProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function ProFeatureGate({ title, description, children }: ProFeatureGateProps) {
  const user = useAuthStore((s) => s.user);

  if (hasProAccess(user)) {
    return <>{children}</>;
  }

  return (
    <PageTransition>
      <MainLayout>
        <PageHeader eyebrow="Pro" title={title} description={description} />
        <Card padding="lg" className="mx-auto max-w-lg text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
            <Crown className="h-6 w-6" />
          </div>
          <h2 className="font-display text-xl font-bold text-ink">{title}</h2>
          <p className="mt-2 text-sm text-muted">
            Fitur ini termasuk Dompet Tenang Pro Lifetime, bersama Export PDF dan bagikan
            laporan. Budget bulanan tetap gratis.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link
              to={ROUTES.UPGRADE}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-accent px-4 text-sm font-semibold text-white shadow-md shadow-accent/20"
            >
              Lihat Pro Lifetime
            </Link>
            <Link
              to={ROUTES.DASHBOARD}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-line px-4 text-sm font-semibold text-muted transition hover:text-ink"
            >
              Kembali
            </Link>
          </div>
        </Card>
      </MainLayout>
    </PageTransition>
  );
}
