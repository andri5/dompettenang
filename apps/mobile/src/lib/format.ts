/** Format helpers for IDR display */

export function formatIDR(amount: number): string {
  const n = Number(amount) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n);
}

/** Compact IDR for dense chips (e.g. Rp1,2jt / Rp16.250) */
export function formatIDRCompact(amount: number): string {
  const n = Math.abs(Number(amount) || 0);
  if (n >= 1_000_000_000) {
    return `Rp${(n / 1_000_000_000).toFixed(1).replace('.', ',')}M`;
  }
  if (n >= 1_000_000) {
    return `Rp${(n / 1_000_000).toFixed(1).replace('.', ',')}jt`;
  }
  if (n >= 100_000) {
    return `Rp${Math.round(n / 1_000)}rb`;
  }
  return `Rp${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n)}`;
}

export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatDateShort(iso: string): string {
  const d = new Date(iso.slice(0, 10) + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
