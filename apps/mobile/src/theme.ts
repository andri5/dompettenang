/**
 * Neo Ledger + Midnight themes — aligned with apps/web
 */

export type AppThemeId = 'neo' | 'midnight' | 'ocean';

export type ThemeColors = {
  bg: string;
  mistDeep: string;
  surface: string;
  border: string;
  text: string;
  textSoft: string;
  muted: string;
  faint: string;
  brand: string;
  brandBright: string;
  brandDark: string;
  brandSoft: string;
  brandSoftBorder: string;
  income: string;
  incomeSoft: string;
  incomeBorder: string;
  expense: string;
  expenseSoft: string;
  expenseBorder: string;
  amber: string;
  amberSoft: string;
  dangerBg: string;
  dangerText: string;
  onBrand: string;
  track: string;
  shadow: string;
  statusBar: 'light' | 'dark';
};

export const neoColors: ThemeColors = {
  bg: '#f3f6f9',
  mistDeep: '#e6edf4',
  surface: '#ffffff',
  border: '#d7e0ea',
  text: '#07111f',
  textSoft: '#122033',
  muted: '#5b6b7c',
  faint: '#94a3b8',
  brand: '#0f9b8e',
  brandBright: '#1cc8b4',
  brandDark: '#0b7d72',
  brandSoft: '#d9f5f1',
  brandSoftBorder: '#99f6e4',
  income: '#16a34a',
  incomeSoft: '#dcfce7',
  incomeBorder: '#bbf7d0',
  expense: '#e24b4a',
  expenseSoft: '#fdecec',
  expenseBorder: '#fecaca',
  amber: '#d97706',
  amberSoft: '#fef3c7',
  dangerBg: '#fdecec',
  dangerText: '#e24b4a',
  onBrand: '#ffffff',
  track: '#e8eef5',
  shadow: 'rgba(7, 17, 31, 0.06)',
  statusBar: 'dark',
};

export const midnightColors: ThemeColors = {
  bg: '#0b1118',
  mistDeep: '#1a2433',
  surface: '#151e2a',
  border: '#243040',
  text: '#e8eef5',
  textSoft: '#c5d0de',
  muted: '#93a4b8',
  faint: '#64748b',
  brand: '#1cc8b4',
  brandBright: '#5eead4',
  brandDark: '#0f9b8e',
  brandSoft: '#12352f',
  brandSoftBorder: '#1a4a42',
  income: '#4ade80',
  incomeSoft: '#14532d',
  incomeBorder: '#166534',
  expense: '#f87171',
  expenseSoft: '#3f1515',
  expenseBorder: '#7f1d1d',
  amber: '#fbbf24',
  amberSoft: '#422006',
  dangerBg: '#3f1515',
  dangerText: '#f87171',
  onBrand: '#07111f',
  track: '#1a2433',
  shadow: 'rgba(0, 0, 0, 0.35)',
  statusBar: 'light',
};

export const oceanColors: ThemeColors = {
  bg: '#f0f7fb',
  mistDeep: '#dceaf2',
  surface: '#ffffff',
  border: '#cfe0ea',
  text: '#0f172a',
  textSoft: '#1e293b',
  muted: '#64748b',
  faint: '#94a3b8',
  brand: '#0e7490',
  brandBright: '#06b6d4',
  brandDark: '#155e75',
  brandSoft: '#cffafe',
  brandSoftBorder: '#a5f3fc',
  income: '#059669',
  incomeSoft: '#d1fae5',
  incomeBorder: '#a7f3d0',
  expense: '#e11d48',
  expenseSoft: '#ffe4e6',
  expenseBorder: '#fecdd3',
  amber: '#d97706',
  amberSoft: '#fef3c7',
  dangerBg: '#ffe4e6',
  dangerText: '#e11d48',
  onBrand: '#ffffff',
  track: '#eef6fa',
  shadow: 'rgba(15, 23, 42, 0.06)',
  statusBar: 'dark',
};

export const themes: Record<AppThemeId, ThemeColors> = {
  neo: neoColors,
  midnight: midnightColors,
  ocean: oceanColors,
};

export const THEME_OPTIONS: {
  id: AppThemeId;
  name: string;
  hint: string;
  icon: 'sunny-outline' | 'moon-outline' | 'water-outline';
  previewFrom: string;
  previewTo: string;
  accent: string;
}[] = [
  {
    id: 'neo',
    name: 'Neo Ledger',
    hint: 'Terang & bersih',
    icon: 'sunny-outline',
    previewFrom: '#f3f6f9',
    previewTo: '#ffffff',
    accent: '#0f9b8e',
  },
  {
    id: 'midnight',
    name: 'Midnight',
    hint: 'Gelap nyaman',
    icon: 'moon-outline',
    previewFrom: '#0b1118',
    previewTo: '#151e2a',
    accent: '#1cc8b4',
  },
  {
    id: 'ocean',
    name: 'Ocean Mist',
    hint: 'Biru laut lembut',
    icon: 'water-outline',
    previewFrom: '#eef6fa',
    previewTo: '#ffffff',
    accent: '#0e7490',
  },
];

/** Default / fallback palette (Neo). Prefer useTheme().colors in components. */
export const colors = neoColors;

export const radii = {
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

export function makeTypography(c: ThemeColors) {
  return {
    brand: { fontSize: 13, fontWeight: '700' as const, letterSpacing: 0.4, color: c.brand },
    eyebrow: {
      fontSize: 11,
      fontWeight: '700' as const,
      letterSpacing: 1.2,
      textTransform: 'uppercase' as const,
      color: c.muted,
    },
    title: { fontSize: 26, fontWeight: '800' as const, color: c.text, letterSpacing: -0.4 },
    subtitle: { fontSize: 14, fontWeight: '500' as const, color: c.muted, lineHeight: 20 },
    body: { fontSize: 15, fontWeight: '500' as const, color: c.text },
    label: { fontSize: 13, fontWeight: '600' as const, color: c.muted },
    amount: { fontSize: 15, fontWeight: '800' as const },
  };
}

export const typography = makeTypography(neoColors);
