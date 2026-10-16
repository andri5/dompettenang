/**
 * Dompet Tenang - Kebijakan Privasi (dinamis dari admin)
 */

import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AuthLayout, PageTransition } from '@/components/layout';
import { SEO } from '@/components/SEO';
import { ROUTES } from '@/lib/constants';
import api from '@/lib/api';

const FALLBACK_PARAS = [
  'Dompet Tenang menyimpan data akun (nama, email, preferensi) dan data keuangan yang Anda catat (transaksi, kategori, unggahan struk/avatar) untuk menyediakan fitur aplikasi.',
  'Data digunakan untuk autentikasi, sinkronisasi antar perangkat, dan menampilkan ringkasan dashboard. Kami tidak menjual data pribadi Anda kepada pihak ketiga untuk iklan.',
  'Unggahan (struk, avatar) dilindungi di server dan hanya dapat diakses oleh akun yang berwenang. Anda dapat meminta penghapusan akun dengan menghubungi pengelola layanan.',
  'Keamanan: password di-hash; sesi memakai token yang dapat dibatalkan. Tetap gunakan password yang kuat dan jangan bagikan tautan reset password.',
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

export function PrivacyPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['legal', 'privacy'],
    queryFn: async () => {
      const res = await api.get('/legal/privacy');
      return res.data.data as LegalDoc;
    },
    staleTime: 60_000,
  });

  const title = data?.title || 'Kebijakan Privasi';
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
        title="Kebijakan Privasi"
        description="Kebijakan privasi dan perlindungan data pengguna Dompet Tenang."
        canonical="/privacy"
      />
      <AuthLayout title={title} subtitle="Bagaimana kami menangani data Anda">
        <div className="max-h-[70vh] space-y-4 overflow-y-auto text-sm leading-relaxed text-muted">
          {isLoading ? (
            <p>Memuat kebijakan…</p>
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
