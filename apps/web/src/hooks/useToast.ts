/**
 * Dompet Tenang - useToast Hook
 * Wrapper around UI store notifications for consistent app toasts.
 */

import { useCallback } from 'react';
import { useUIStore } from '@/stores';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  duration?: number;
  type?: ToastType;
}

export const useToast = () => {
  const addNotification = useUIStore((s) => s.addNotification);
  const removeNotification = useUIStore((s) => s.removeNotification);
  const clearNotifications = useUIStore((s) => s.clearNotifications);

  const toast = useCallback(
    (title: string, message?: string, options?: ToastOptions) => {
      addNotification({
        title,
        message,
        type: options?.type || 'info',
        duration: options?.duration,
      });
    },
    [addNotification]
  );

  const success = useCallback(
    (title: string, message?: string) => toast(title, message, { type: 'success' }),
    [toast]
  );

  const error = useCallback(
    (title: string, message?: string) => toast(title, message, { type: 'error' }),
    [toast]
  );

  const warning = useCallback(
    (title: string, message?: string) => toast(title, message, { type: 'warning' }),
    [toast]
  );

  const info = useCallback(
    (title: string, message?: string) => toast(title, message, { type: 'info' }),
    [toast]
  );

  return {
    toast,
    success,
    error,
    warning,
    info,
    removeToast: removeNotification,
    clearAll: clearNotifications,
  };
};
