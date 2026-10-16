/**
 * 404 — Halaman tidak ditemukan
 */

import { Link } from 'react-router-dom';
import { Compass, ArrowLeft, LayoutDashboard, Home } from 'lucide-react';
import { Button } from '@/components/ui';
import { PageTransition } from '@/components/layout';
import { SEO } from '@/components/SEO';
import { ROUTES } from '@/lib/constants';
import { useAuthStore } from '@/stores';
import { StatusPageShell } from './StatusPageShell';

export function NotFoundPage() {
  const isLoggedIn = useAuthStore((s) => !!s.user);

  return (
    <PageTransition>
      <SEO
        title="Halaman tidak ditemukan"
        description="Halaman yang kamu cari tidak ada di Dompet Tenang."
        canonical="/404"
        noIndex
      />
      <StatusPageShell
        badge="Error 404"
        title="Halaman tidak ditemukan"
        description="Alamat yang kamu buka tidak ada atau sudah dipindahkan. Periksa URL-nya, atau kembali ke beranda Dompet Tenang."
        icon={<Compass className="h-7 w-7" />}
        actions={
          <>
            <Link to={ROUTES.HOME}>
              <Button variant="gradient" leftIcon={<Home className="h-4 w-4" />}>
                Ke Beranda
              </Button>
            </Link>
            {isLoggedIn ? (
              <Link to={ROUTES.DASHBOARD}>
                <Button variant="outline" leftIcon={<LayoutDashboard className="h-4 w-4" />}>
                  Ke Dashboard
                </Button>
              </Link>
            ) : (
              <Link to={ROUTES.LOGIN}>
                <Button variant="outline" leftIcon={<LayoutDashboard className="h-4 w-4" />}>
                  Masuk
                </Button>
              </Link>
            )}
            <Button
              type="button"
              variant="ghost"
              leftIcon={<ArrowLeft className="h-4 w-4" />}
              onClick={() => window.history.back()}
            >
              Kembali
            </Button>
          </>
        }
      />
    </PageTransition>
  );
}
