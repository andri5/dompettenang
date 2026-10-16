/**
 * Dompet Tenang - Auth Store
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';
import {
  login as loginApi,
  logout as logoutApi,
  register as registerApi,
  saveAuthData,
  clearAuthData,
  restoreSession,
} from '@/services/auth.service';
import type { LoginCredentials, RegisterData } from '@/types';
import { STORAGE_KEYS } from '@/lib/constants';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isBootstrapping: boolean;
  error: string | null;
}

interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  clearError: () => void;
  initAuth: () => Promise<void>;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isBootstrapping: true,
      error: null,

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });
        try {
          const data = await loginApi(credentials);
          saveAuthData(data);
          set({
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
            isBootstrapping: false,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Login failed';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null });
        try {
          const authData = await registerApi(data);
          saveAuthData(authData);
          set({
            user: authData.user,
            isAuthenticated: true,
            isLoading: false,
            isBootstrapping: false,
          });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Registration failed';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await logoutApi();
        } finally {
          clearAuthData();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      setUser: (user: User | null) => {
        if (user) {
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        } else {
          localStorage.removeItem(STORAGE_KEYS.USER);
        }
        set({ user, isAuthenticated: !!user });
      },

      clearError: () => {
        set({ error: null });
      },

      initAuth: async () => {
        set({ isBootstrapping: true });
        try {
          const user = await restoreSession();
          set({
            user,
            isAuthenticated: !!user,
            isBootstrapping: false,
          });
        } catch {
          clearAuthData();
          set({
            user: null,
            isAuthenticated: false,
            isBootstrapping: false,
          });
        }
      },
    }),
    {
      name: 'dompettenang-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
