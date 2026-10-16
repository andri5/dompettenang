/**
 * Public site URL for SEO (canonical, Open Graph, sitemap).
 * Set VITE_SITE_URL at build time in production.
 */

export const SITE_NAME = 'Dompet Tenang';

export const SITE_URL = (
  (import.meta.env.VITE_SITE_URL as string | undefined) ||
  (typeof window !== 'undefined' ? window.location.origin : 'https://dompet-tenang.web.id')
).replace(/\/$/, '');

export const DEFAULT_SEO_DESCRIPTION =
  'Aplikasi pencatatan keuangan pribadi gratis. Catat pemasukan & pengeluaran, atur budget, pantau tabungan — tenang kelola dompetmu setiap hari.';

export const DEFAULT_SEO_KEYWORDS =
  'aplikasi keuangan, catat pengeluaran, pencatatan keuangan pribadi, budget bulanan, target tabungan, Dompet Tenang, keuangan Indonesia, expense tracker';

export function absoluteUrl(path = '/'): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${normalized}`;
}
