/**
 * Format nominal while typing (IDR style): 1000000 → 1.000.000
 */

export function formatAmountInput(raw: string): string {
  const digits = String(raw ?? '').replace(/\D/g, '');
  if (!digits) return '';
  const normalized = digits.replace(/^0+(?=\d)/, '');
  return normalized.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function parseAmountInput(formatted: string): number {
  const digits = String(formatted ?? '').replace(/\D/g, '');
  if (!digits) return 0;
  const n = Number(digits);
  return Number.isFinite(n) ? n : 0;
}
