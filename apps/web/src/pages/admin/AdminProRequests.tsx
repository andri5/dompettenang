/**
 * Dompet Tenang - Admin: Pro purchase requests (manual transfer)
 */

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Crown, ExternalLink, X } from 'lucide-react';
import api from '@/lib/api';
import { Card, EmptyState, Button, Badge } from '@/components/ui';
import { useToast } from '@/hooks/useToast';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { getUploadContentPath } from '@/lib/constants';
import {
  approveProRequest,
  fetchAdminProRequests,
  rejectProRequest,
  type AdminProPurchaseRequest,
  type ProPurchaseStatus,
} from '@/services/billing.service';
import { useAuthenticatedFileUrl } from '@/hooks/useAuthenticatedFileUrl';

const FILTERS: { id: string; label: string }[] = [
  { id: '', label: 'Semua' },
  { id: 'PROOF_SUBMITTED', label: 'Perlu review' },
  { id: 'PENDING', label: 'Pending' },
  { id: 'APPROVED', label: 'Disetujui' },
  { id: 'REJECTED', label: 'Ditolak' },
];

const STATUS_VARIANT: Record<
  ProPurchaseStatus,
  'secondary' | 'info' | 'success' | 'danger'
> = {
  PENDING: 'secondary',
  PROOF_SUBMITTED: 'info',
  APPROVED: 'success',
  REJECTED: 'danger',
};

export function AdminProRequests() {
  const toast = useToast();
  const qc = useQueryClient();
  const [filter, setFilter] = useState('PROOF_SUBMITTED');
  const [noteById, setNoteById] = useState<Record<string, string>>({});

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['admin', 'pro-requests', filter],
    queryFn: () => fetchAdminProRequests(filter || undefined),
  });

  const approveMut = useMutation({
    mutationFn: ({ id, adminNote }: { id: string; adminNote?: string }) =>
      approveProRequest(id, adminNote),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'pro-requests'] });
      toast.success('Pro diaktifkan untuk user');
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      toast.error(err?.response?.data?.message || 'Gagal approve'),
  });

  const rejectMut = useMutation({
    mutationFn: ({ id, adminNote }: { id: string; adminNote?: string }) =>
      rejectProRequest(id, adminNote),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'pro-requests'] });
      toast.success('Permintaan ditolak');
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      toast.error(err?.response?.data?.message || 'Gagal menolak'),
  });

  const pendingReview = items.filter((i) => i.status === 'PROOF_SUBMITTED').length;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="mb-1 font-display text-2xl font-extrabold text-ink">
            Pro Requests
          </h1>
          <p className="text-sm text-muted">
            Verifikasi transfer bank untuk aktivasi Pro Lifetime
          </p>
        </div>
        {pendingReview > 0 && filter === 'PROOF_SUBMITTED' ? (
          <div className="rounded-xl bg-accent-soft px-3 py-2 text-sm font-bold text-accent">
            {pendingReview} menunggu review
          </div>
        ) : null}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id || 'all'}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              'rounded-xl px-3 py-1.5 text-xs font-semibold transition',
              filter === f.id
                ? 'bg-violet-100 text-violet-700'
                : 'bg-mist text-muted hover:text-ink'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-muted">Memuat...</p>
      ) : items.length === 0 ? (
        <Card padding="lg">
          <EmptyState
            icon={<Crown className="h-7 w-7" />}
            title="Belum ada permintaan"
            description="Permintaan upgrade Pro dari user akan muncul di sini"
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((row) => (
            <ProRequestCard
              key={row.id}
              row={row}
              note={noteById[row.id] || ''}
              onNoteChange={(v) =>
                setNoteById((prev) => ({ ...prev, [row.id]: v }))
              }
              onApprove={() =>
                approveMut.mutate({
                  id: row.id,
                  adminNote: noteById[row.id]?.trim() || undefined,
                })
              }
              onReject={() =>
                rejectMut.mutate({
                  id: row.id,
                  adminNote: noteById[row.id]?.trim() || undefined,
                })
              }
              busy={approveMut.isPending || rejectMut.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProRequestCard({
  row,
  note,
  onNoteChange,
  onApprove,
  onReject,
  busy,
}: {
  row: AdminProPurchaseRequest;
  note: string;
  onNoteChange: (v: string) => void;
  onApprove: () => void;
  onReject: () => void;
  busy: boolean;
}) {
  const contentPath = getUploadContentPath(row.proofPath);
  const { url: proofUrl } = useAuthenticatedFileUrl(row.proofPath);
  const canAct =
    row.status === 'PENDING' || row.status === 'PROOF_SUBMITTED';

  const openProof = async () => {
    if (proofUrl) {
      window.open(proofUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    if (!contentPath) return;
    try {
      const res = await api.get(contentPath, { responseType: 'blob' });
      const blobUrl = URL.createObjectURL(res.data);
      window.open(blobUrl, '_blank', 'noopener,noreferrer');
    } catch {
      /* toast handled by caller if needed */
    }
  };

  return (
    <Card padding="md">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-ink">{row.user.name}</p>
            <Badge variant={STATUS_VARIANT[row.status]}>{row.status}</Badge>
          </div>
          <p className="text-sm text-muted">{row.user.email}</p>
          <p className="mt-2 text-sm text-ink">
            {formatCurrency(row.amount, 'IDR')} · kode{' '}
            <span className="font-mono font-bold">{row.transferNote}</span>
          </p>
          <p className="text-xs text-muted">{formatDate(row.createdAt)}</p>
          {row.adminNote ? (
            <p className="mt-1 text-xs text-muted">Catatan: {row.adminNote}</p>
          ) : null}
        </div>

        {row.proofPath ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            leftIcon={<ExternalLink className="h-3.5 w-3.5" />}
            onClick={() => void openProof()}
          >
            Lihat bukti
          </Button>
        ) : (
          <span className="text-xs text-muted">Belum ada bukti</span>
        )}
      </div>

      {canAct ? (
        <div className="mt-4 space-y-2 border-t border-line pt-3">
          <input
            type="text"
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            placeholder="Catatan admin (opsional)"
            className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
            maxLength={500}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="primary"
              leftIcon={<Check className="h-3.5 w-3.5" />}
              disabled={busy}
              onClick={onApprove}
            >
              Approve → Pro
            </Button>
            <Button
              type="button"
              size="sm"
              variant="danger"
              leftIcon={<X className="h-3.5 w-3.5" />}
              disabled={busy}
              onClick={onReject}
            >
              Tolak
            </Button>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
