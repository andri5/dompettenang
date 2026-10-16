import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import {
  themes,
  type AppThemeId,
  type ThemeColors,
  makeTypography,
} from './theme';

const THEME_KEY = 'dompettenang_theme';

type ThemeContextValue = {
  theme: AppThemeId;
  colors: ThemeColors;
  typography: ReturnType<typeof makeTypography>;
  isDark: boolean;
  setTheme: (theme: AppThemeId) => void;
  ready: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<AppThemeId>('neo');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync(THEME_KEY);
        if (!cancelled && (stored === 'neo' || stored === 'midnight' || stored === 'ocean')) {
          setThemeState(stored);
        }
      } catch {
        /* keep default */
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setTheme = useCallback((next: AppThemeId) => {
    setThemeState(next);
    SecureStore.setItemAsync(THEME_KEY, next).catch(() => undefined);
  }, []);

  const colors = themes[theme];
  const typography = useMemo(() => makeTypography(colors), [colors]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      colors,
      typography,
      isDark: theme === 'midnight',
      setTheme,
      ready,
    }),
    [theme, colors, typography, setTheme, ready]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}

export function useColors() {
  return useTheme().colors;
}
