/**
 * Poll Pro purchase requests and toast once when admin rejects.
 */

import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores';
import { hasProAccess } from '@/lib/plan';
import { useToast } from '@/hooks/useToast';
import {
  fetchMyPurchaseRequests,
  type ProPurchaseRequest,
} from '@/services/billing.service';

const NOTIFIED_PREFIX = 'dt_pro_reject_toast_';

function alreadyNotified(requestId: string): boolean {
  try {
    return sessionStorage.getItem(`${NOTIFIED_PREFIX}${requestId}`) === '1';
  } catch {
    return false;
  }
}

function markNotified(requestId: string): void {
  try {
    sessionStorage.setItem(`${NOTIFIED_PREFIX}${requestId}`, '1');
  } catch {
    /* ignore */
  }
}

function isRecentRejection(row: ProPurchaseRequest): boolean {
  const raw = row.reviewedAt || row.updatedAt;
  if (!raw) return true;
  const t = new Date(raw).getTime();
  if (Number.isNaN(t)) return true;
  return Date.now() - t < 48 * 60 * 60 * 1000;
}

export function useWatchProPurchaseRejection() {
  const toast = useToast();
  const user = useAuthStore((s) => s.user);
  const isPro = hasProAccess(user);
  const watchingIdRef = useRef<string | null>(null);

  const enabled = Boolean(user) && !isPro;

  const { data: rows = [] } = useQuery({
    queryKey: ['billing', 'my-requests'],
    queryFn: fetchMyPurchaseRequests,
    enabled,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: enabled ? 15_000 : false,
  });

  useEffect(() => {
    if (!enabled || rows.length === 0) return;

    const waiting = rows.find(
      (r) => r.status === 'PENDING' || r.status === 'PROOF_SUBMITTED'
    );
    if (waiting) {
      watchingIdRef.current = waiting.id;
      return;
    }

    const watchedId = watchingIdRef.current;
    const rejected =
      (watchedId
        ? rows.find((r) => r.id === watchedId && r.status === 'REJECTED')
        : null) ||
      (rows[0]?.status === 'REJECTED' && isRecentRejection(rows[0])
        ? rows[0]
        : null);

    if (!rejected || alreadyNotified(rejected.id)) return;

    markNotified(rejected.id);
    watchingIdRef.current = null;
    toast.error(
      'Pembayaran Pro ditolak',
      rejected.adminNote
        ? `Alasan: ${rejected.adminNote}`
        : 'Silakan unggah ulang atau buat permintaan baru di halaman Upgrade.'
    );
  }, [enabled, rows, toast]);
}
