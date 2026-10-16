/**
 * Dompet Tenang - Modal Component
 */

import type { ReactNode } from 'react';
import { Wallet, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
  animated?: boolean;
  showBrand?: boolean;
}

const sizeStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  showBrand = true,
}: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-ink/50 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
            <motion.div
              initial={{ opacity: 0, y: 28, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ type: 'spring', damping: 24, stiffness: 280 }}
              className={cn(
                'relative w-full rounded-t-[1.5rem] bg-surface shadow-2xl sm:rounded-[1.5rem]',
                sizeStyles[size]
              )}
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? 'modal-title' : undefined}
            >
              {(title || showCloseButton) && (
                <div className="flex items-center justify-between border-b border-line px-5 py-4 sm:px-6">
                  {title ? (
                    <div className="flex min-w-0 items-center gap-3">
                      {showBrand && (
                        <div className="brand-mark flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-ink shadow-sm shadow-accent/20">
                          <Wallet className="h-4 w-4" />
                        </div>
                      )}
                      <h2
                        id="modal-title"
                        className="font-display text-lg font-bold tracking-[-0.03em] text-ink"
                      >
                        {title}
                      </h2>
                    </div>
                  ) : (
                    <span />
                  )}
                  {showCloseButton && (
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-xl p-2 text-muted transition hover:bg-mist hover:text-ink"
                      aria-label="Close modal"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
              )}
              <div className="max-h-[75vh] overflow-y-auto p-5 sm:p-6">{children}</div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

export interface ModalFooterProps {
  children: ReactNode;
  className?: string;
}

export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div
      className={cn(
        'mt-6 flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-end sm:gap-3',
        className
      )}
    >
      {children}
    </div>
  );
}
