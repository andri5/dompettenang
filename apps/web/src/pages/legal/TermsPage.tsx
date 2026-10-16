/**
 * Dompet Tenang - Syarat & Ketentuan (dinamis dari admin)
 */

import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AuthLayout, PageTransition } from '@/components/layout';
import { SEO } from '@/components/SEO';
import { ROUTES } from '@/lib/constants';
import api from '@/lib/api';

const FALLBACK_PARAS = [
  'Dengan mendaftar dan menggunakan Dompet Tenang, Anda menyetujui untuk memakai aplikasi sebagai catatan keuangan pribadi secara wajar dan sesuai hukum yang berlaku.',
  'Anda bertanggung jawab menjaga kerahasiaan akun (email dan password). Dompet Tenang tidak bertanggung jawab atas kerugian akibat kelalaian menjaga kredensial atau penggunaan perangkat yang tidak aman.',
  'Data transaksi yang Anda masukkan milik Anda. Kami menyediakan layanan penyimpanan dan tampilan untuk membantu pengelolaan keuangan pribadi, tanpa jaminan hasil investasi atau saran keuangan profesional.',
  'Kami dapat memperbarui ketentuan ini dari waktu ke waktu. Penggunaan berkelanjutan setelah pembaruan dianggap sebagai persetujuan terhadap ketentuan terbaru.',
];

type LegalDoc = {
  title: string;
  body: string;
  updatedAt: string;
};

function splitParas(body: string) {
  return body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function TermsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['legal', 'terms'],
    queryFn: async () => {
      const res = await api.get('/legal/terms');
      return res.data.data as LegalDoc;
    },
    staleTime: 60_000,
  });

  const title = data?.title || 'Syarat & Ketentuan';
  const paras = data?.body ? splitParas(data.body) : FALLBACK_PARAS;
  const updatedLabel = data?.updatedAt
    ? new Date(data.updatedAt).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Agustus 2026';

  return (
    <PageTransition>
      <SEO
        title="Syarat & Ketentuan"
        description="Syarat dan ketentuan penggunaan aplikasi Dompet Tenang."
        canonical="/terms"
      />
      <AuthLayout title={title} subtitle="Ketentuan penggunaan Dompet Tenang">
        <div className="max-h-[70vh] space-y-4 overflow-y-auto text-sm leading-relaxed text-muted">
          {isLoading ? (
            <p>Memuat ketentuan…</p>
          ) : (
            paras.map((p) => <p key={p.slice(0, 48)}>{p}</p>)
          )}
          <p className="text-xs text-muted">Terakhir diperbarui: {updatedLabel}</p>
        </div>
        <p className="mt-4 text-center text-sm">
          <Link to={ROUTES.REGISTER} className="font-semibold text-accent hover:underline">
            Kembali ke pendaftaran
          </Link>
        </p>
      </AuthLayout>
    </PageTransition>
  );
}
