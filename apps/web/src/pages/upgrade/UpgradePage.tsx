/**
 * Dompet Tenang - Upgrade to Pro Lifetime (manual bank transfer)
 */

import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Check,
  Copy,
  Crown,
  FileImage,
  Loader2,
  ShieldCheck,
  Sparkles,
  Upload,
} from 'lucide-react';
import { MainLayout, PageHeader, PageTransition } from '@/components/layout';
import { Button, Card, Badge } from '@/components/ui';
import { SEO } from '@/components/SEO';
import { useToast } from '@/hooks/useToast';
import { useAuthStore } from '@/stores';
import { hasProAccess } from '@/lib/plan';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import {
  createPurchaseRequest,
  fetchBillingPlans,
  fetchMyPurchaseRequests,
  uploadPurchaseProof,
  type ProPurchaseRequest,
} from '@/services/billing.service';
import { getCurrentUser } from '@/services/auth.service';

const STATUS_LABEL: Record<ProPurchaseRequest['status'], string> = {
  PENDING: 'Menunggu transfer',
  PROOF_SUBMITTED: 'Bukti dikirim — menunggu verifikasi',
  APPROVED: 'Disetujui',
  REJECTED: 'Ditolak',
};

const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,application/pdf';
const MAX_SIZE = 5 * 1024 * 1024;

export function UpgradePage() {
  const toast = useToast();
  const qc = useQueryClient();
  const { user, setUser } = useAuthStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const isPro = hasProAccess(user);

  const plansQuery = useQuery({
    queryKey: ['billing', 'plans'],
    queryFn: fetchBillingPlans,
  });

  const requestsQuery = useQuery({
    queryKey: ['billing', 'my-requests'],
    queryFn: fetchMyPurchaseRequests,
    enabled: Boolean(user) && !isPro,
  });

  const activeRequest = useMemo(() => {
    const rows = requestsQuery.data || [];
    return (
      rows.find((r) => r.status === 'PENDING' || r.status === 'PROOF_SUBMITTED') ||
      rows[0] ||
      null
    );
  }, [requestsQuery.data]);

  const createMut = useMutation({
    mutationFn: createPurchaseRequest,
    onSuccess: (data) => {
      qc.setQueryData(['billing', 'plans'], {
        lifetime: data.lifetime,
        bank: data.bank,
      });
      qc.invalidateQueries({ queryKey: ['billing', 'my-requests'] });
      toast.success('Permintaan dibuat. Transfer sesuai kode di bawah.');
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message || 'Gagal membuat permintaan');
    },
  });

  const proofMut = useMutation({
    mutationFn: async () => {
      if (!activeRequest || !selectedFile) throw new Error('Pilih file bukti dulu');
      return uploadPurchaseProof(activeRequest.id, selectedFile);
    },
    onSuccess: async () => {
      setSelectedFile(null);
      if (fileRef.current) fileRef.current.value = '';
      qc.invalidateQueries({ queryKey: ['billing', 'my-requests'] });
      toast.success('Bukti terkirim. Admin akan memverifikasi.');
      try {
        const me = await getCurrentUser();
        setUser(me);
      } catch {
        /* ignore */
      }
    },
    onError: (err: { response?: { data?: { message?: string } }; message?: string }) => {
      toast.error(err?.response?.data?.message || err?.message || 'Gagal unggah bukti');
    },
  });

  const plans = plansQuery.data;
  const price = plans?.lifetime.price ?? 29000;
  const bank = plans?.bank;

  const copyText = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} disalin`);
    } catch {
      toast.error('Gagal menyalin');
    }
  };

  const onPickFile = (file: File | undefined) => {
    if (!file) return;
    if (!ACCEPT.split(',').includes(file.type)) {
      toast.error('Format harus gambar atau PDF');
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error('Ukuran maksimal 5MB');
      return;
    }
    setSelectedFile(file);
  };

  return (
    <PageTransition>
      <SEO
        title="Upgrade Pro"
        description="Upgrade Dompet Tenang Pro Lifetime — sekali bayar, akses selamanya."
        canonical="/upgrade"
      />
      <MainLayout>
        <PageHeader
          eyebrow="Pro"
          title="Upgrade Pro"
          description="Sekali bayar — akses Pro seumur hidup (early bird)"
        />

        <div className="mx-auto max-w-2xl space-y-6">
          {isPro ? (
            <Card padding="lg" className="text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent">
                <Crown className="h-7 w-7" />
              </div>
              <h2 className="font-display text-xl font-bold text-ink">Kamu sudah Pro</h2>
              <p className="mt-2 text-sm text-muted">
                Export PDF, bagikan laporan, dan fitur Pro lainnya sudah aktif.
              </p>
              <Link
                to={ROUTES.DASHBOARD}
                className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-accent px-4 text-sm font-semibold text-white shadow-md shadow-accent/20"
              >
                Kembali ke Dashboard
              </Link>
            </Card>
          ) : (
            <>
              <Card padding="lg" className="overflow-hidden">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1 text-xs font-bold text-accent">
                      <Sparkles className="h-3.5 w-3.5" />
                      Early bird
                    </div>
                    <h2 className="font-display text-2xl font-extrabold text-ink">
                      Pro Lifetime
                    </h2>
                    <p className="mt-1 text-sm text-muted">
                      {plans?.lifetime.description ||
                        'Sekali bayar — akses Pro selamanya.'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-3xl font-extrabold text-accent">
                      {formatCurrency(price, 'IDR')}
                    </p>
                    <p className="text-xs text-muted">sekali bayar</p>
                  </div>
                </div>

                <ul className="mt-6 space-y-2.5 text-sm text-ink">
                  {[
                    'Export laporan PDF',
                    'Bagikan ringkasan dari mobile',
                    'Akses Pro tanpa langganan bulanan',
                    'Harga early bird — bisa naik nanti',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card padding="lg">
                <div className="mb-4 flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-accent" />
                  <h3 className="font-display text-lg font-bold text-ink">
                    Cara upgrade
                  </h3>
                </div>
                <ol className="mb-5 list-decimal space-y-2 pl-5 text-sm text-muted">
                  <li>Buat permintaan — dapat kode transfer unik.</li>
                  <li>Transfer tepat ke rekening di bawah, cantumkan kode di berita.</li>
                  <li>Unggah bukti transfer — admin verifikasi (biasanya &lt; 24 jam).</li>
                </ol>

                {!activeRequest ? (
                  <Button
                    type="button"
                    variant="gradient"
                    isLoading={createMut.isPending}
                    onClick={() => createMut.mutate()}
                    disabled={plansQuery.isLoading || bank?.configured === false}
                  >
                    Mulai upgrade — {formatCurrency(price, 'IDR')}
                  </Button>
                ) : null}

                {bank && !bank.configured ? (
                  <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    Rekening pembayaran belum dikonfigurasi. Admin perlu mengisi rekening di{' '}
                    <Link to={ROUTES.ADMIN_PRO} className="font-bold underline">
                      Admin → Pro
                    </Link>
                    .
                  </p>
                ) : null}

                {activeRequest ? (
                  <div className="mt-2 space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={
                          activeRequest.status === 'PROOF_SUBMITTED'
                            ? 'info'
                            : activeRequest.status === 'REJECTED'
                              ? 'danger'
                              : 'secondary'
                        }
                      >
                        {STATUS_LABEL[activeRequest.status]}
                      </Badge>
                      <span className="text-xs text-muted">
                        Dibuat {formatDate(activeRequest.createdAt)}
                      </span>
                    </div>

                    {bank?.configured ? (
                      <div className="rounded-2xl border border-line bg-mist/40 p-4 text-sm">
                        <p className="mb-3 font-semibold text-ink">Transfer ke</p>
                        <BankRow
                          label="Bank"
                          value={bank.name || ''}
                          onCopy={() => copyText('Bank', bank.name || '')}
                        />
                        <BankRow
                          label="No. rekening"
                          value={bank.account || ''}
                          onCopy={() => copyText('No. rekening', bank.account || '')}
                        />
                        <BankRow
                          label="Atas nama"
                          value={bank.holder || ''}
                          onCopy={() => copyText('Atas nama', bank.holder || '')}
                        />
                        <BankRow
                          label="Jumlah"
                          value={formatCurrency(activeRequest.amount, 'IDR')}
                          onCopy={() =>
                            copyText('Jumlah', String(activeRequest.amount))
                          }
                        />
                        <BankRow
                          label="Kode / berita"
                          value={activeRequest.transferNote}
                          highlight
                          onCopy={() =>
                            copyText('Kode transfer', activeRequest.transferNote)
                          }
                        />
                      </div>
                    ) : null}

                    {activeRequest.status === 'REJECTED' && activeRequest.adminNote ? (
                      <p className="rounded-xl border border-coral/20 bg-coral-soft px-3 py-2 text-sm text-ink">
                        Catatan admin: {activeRequest.adminNote}
                      </p>
                    ) : null}

                    {activeRequest.status === 'REJECTED' ? (
                      <Button
                        type="button"
                        variant="primary"
                        isLoading={createMut.isPending}
                        onClick={() => createMut.mutate()}
                      >
                        Buat permintaan baru
                      </Button>
                    ) : null}

                    {(activeRequest.status === 'PENDING' ||
                      activeRequest.status === 'PROOF_SUBMITTED') && (
                      <div className="rounded-2xl border border-dashed border-line p-4">
                        <p className="mb-2 text-sm font-semibold text-ink">
                          Unggah bukti transfer
                        </p>
                        <p className="mb-3 text-xs text-muted">
                          JPG, PNG, WEBP, GIF, atau PDF — maks. 5MB
                        </p>
                        <input
                          ref={fileRef}
                          type="file"
                          accept={ACCEPT}
                          className="hidden"
                          onChange={(e) => onPickFile(e.target.files?.[0])}
                        />
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            leftIcon={<FileImage className="h-4 w-4" />}
                            onClick={() => fileRef.current?.click()}
                          >
                            {selectedFile ? selectedFile.name : 'Pilih file'}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            leftIcon={
                              proofMut.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Upload className="h-4 w-4" />
                              )
                            }
                            disabled={!selectedFile || proofMut.isPending}
                            onClick={() => proofMut.mutate()}
                          >
                            Kirim bukti
                          </Button>
                        </div>
                        {activeRequest.proofPath ? (
                          <p className="mt-3 text-xs text-accent">
                            Bukti sudah terkirim. Menunggu verifikasi admin.
                          </p>
                        ) : null}
                      </div>
                    )}
                  </div>
                ) : null}
              </Card>
            </>
          )}
        </div>
      </MainLayout>
    </PageTransition>
  );
}

function BankRow({
  label,
  value,
  onCopy,
  highlight,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 border-b border-line/60 py-2 last:border-0',
        highlight && 'rounded-xl bg-accent-soft/60 px-2'
      )}
    >
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
          {label}
        </p>
        <p className="truncate font-semibold text-ink">{value}</p>
      </div>
      <button
        type="button"
        onClick={onCopy}
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-surface hover:text-accent"
        aria-label={`Salin ${label}`}
      >
        <Copy className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
