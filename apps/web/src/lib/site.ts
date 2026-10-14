/**
 * Public site URL for SEO (canonical, Open Graph, sitemap).
 * Set VITE_SITE_URL at build time in production.
 */

export const SITE_NAME = 'Dompet Tenang';

export const SITE_URL = (
  (import.meta.env.VITE_SITE_URL as string | undefined) ||
  (typeof window !== 'undefined' ? window.location.origin : 'https://dompet-tenang.web.id')
).replace(/\/$/, '');

/** Public Android APK (hosted on VPS via Caddy /download/*). */
export const ANDROID_APK_URL = (
  (import.meta.env.VITE_ANDROID_APK_URL as string | undefined) ||
  '/download/dompet-tenang.apk'
).trim();

/** Expo / EAS builds page for internal testers. */
export const EXPO_BUILDS_URL = (
  (import.meta.env.VITE_EXPO_BUILDS_URL as string | undefined) ||
  'https://expo.dev/accounts/andri5/projects/duitdiary/builds'
).trim();

export const DEFAULT_SEO_DESCRIPTION =
  'Aplikasi pencatatan keuangan pribadi gratis. Catat pemasukan & pengeluaran, atur budget, pantau tabungan — tenang kelola dompetmu setiap hari.';

export const DEFAULT_SEO_KEYWORDS =
  'aplikasi keuangan, catat pengeluaran, pencatatan keuangan pribadi, budget bulanan, target tabungan, Dompet Tenang, keuangan Indonesia, expense tracker';

export function absoluteUrl(path = '/'): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${normalized}`;
}
