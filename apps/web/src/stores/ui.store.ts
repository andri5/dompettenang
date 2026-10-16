/**
 * Dompet Tenang - UI Store
 * Zustand store for UI state (sidebar, modals, notifications, theme)
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppTheme } from '@/lib/constants';
import { STORAGE_KEYS } from '@/lib/constants';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

interface UIState {
  isSidebarOpen: boolean;
  isMobileMenuOpen: boolean;
  notifications: Notification[];
  isLoading: boolean;
  theme: AppTheme;
}

interface UIActions {
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;
  setMobileMenuOpen: (open: boolean) => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  setLoading: (loading: boolean) => void;
  setTheme: (theme: AppTheme) => void;
}

type UIStore = UIState & UIActions;

let notificationId = 0;

function applyThemeToDocument(theme: AppTheme) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(STORAGE_KEYS.THEME, theme);
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      isSidebarOpen: true,
      isMobileMenuOpen: false,
      notifications: [],
      isLoading: false,
      theme: 'neo',

      toggleSidebar: () => {
        set((state) => ({ isSidebarOpen: !state.isSidebarOpen }));
      },

      setSidebarOpen: (open: boolean) => {
        set({ isSidebarOpen: open });
      },

      toggleMobileMenu: () => {
        set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen }));
      },

      setMobileMenuOpen: (open: boolean) => {
        set({ isMobileMenuOpen: open });
      },

      addNotification: (notification: Omit<Notification, 'id'>) => {
        const id = `notification-${++notificationId}`;
        const newNotification: Notification = {
          ...notification,
          id,
          duration: notification.duration ?? 5000,
        };

        set((state) => ({
          notifications: [...state.notifications, newNotification],
        }));

        if (newNotification.duration && newNotification.duration > 0) {
          setTimeout(() => {
            set((state) => ({
              notifications: state.notifications.filter((n) => n.id !== id),
            }));
          }, newNotification.duration);
        }
      },

      removeNotification: (id: string) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      },

      clearNotifications: () => {
        set({ notifications: [] });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setTheme: (theme: AppTheme) => {
        applyThemeToDocument(theme);
        set({ theme });
      },
    }),
    {
      name: 'dompettenang-ui',
      partialize: (state) => ({
        theme: state.theme,
        isSidebarOpen: state.isSidebarOpen,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.theme) {
          applyThemeToDocument(state.theme);
        }
      },
    }
  )
);

/** Call once on app boot before paint if possible */
export function initThemeFromStorage() {
  const stored = localStorage.getItem(STORAGE_KEYS.THEME) as AppTheme | null;
  const theme: AppTheme =
    stored === 'neo' || stored === 'midnight' || stored === 'ocean'
      ? stored
      : 'neo';
  applyThemeToDocument(theme);
  return theme;
}
