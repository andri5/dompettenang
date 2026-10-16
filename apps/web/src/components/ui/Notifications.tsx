/**
 * Dompet Tenang - Notification Toast
 */

import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores';

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const styles = {
  success: 'bg-lime-soft border-lime/20 text-ink',
  error: 'bg-coral-soft border-coral/20 text-ink',
  warning: 'bg-amber-soft border-amber/20 text-ink',
  info: 'bg-accent-soft border-accent/20 text-ink',
};

const iconStyles = {
  success: 'text-lime',
  error: 'text-coral',
  warning: 'text-amber',
  info: 'text-accent',
};

export function Notifications() {
  const { notifications, removeNotification } = useUIStore();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-[calc(6.25rem+var(--safe-bottom))] left-3 right-3 z-50 flex flex-col gap-2 sm:bottom-6 sm:left-auto sm:right-6 sm:w-96 lg:bottom-6">
      <AnimatePresence>
        {notifications.map((notification) => {
          const Icon = icons[notification.type];
          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              className={cn(
                'flex items-start gap-3 rounded-2xl border p-4 shadow-[var(--shadow-lift)] backdrop-blur-md',
                styles[notification.type]
              )}
              role="alert"
            >
              <Icon className={cn('mt-0.5 h-5 w-5 flex-shrink-0', iconStyles[notification.type])} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{notification.title}</p>
                {notification.message && (
                  <p className="mt-1 text-sm text-muted">{notification.message}</p>
                )}
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="flex-shrink-0 rounded-lg p-1 text-muted transition hover:bg-white/60 hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
