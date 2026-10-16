/**
 * Collapsible dashboard section
 */

import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Card } from '@/components/ui';
import { cn } from '@/lib/utils';

export function CollapsibleSection({
  title,
  icon,
  defaultOpen = true,
  children,
  headerExtra,
}: {
  title: string;
  icon?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  headerExtra?: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card padding="none" className="mb-4 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-mist/40 sm:px-5"
        aria-expanded={open}
      >
        {icon}
        <div className="min-w-0 flex-1">
          <p className="font-display text-base font-bold text-ink sm:text-lg">{title}</p>
          {headerExtra}
        </div>
        <span className="rounded-xl bg-mist-deep px-2.5 py-1 text-xs font-semibold text-muted">
          {open ? 'Sembunyikan' : 'Tampilkan'}
        </span>
        <ChevronDown
          className={cn('h-5 w-5 flex-shrink-0 text-muted transition', open && 'rotate-180')}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-line px-4 py-4 sm:px-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
