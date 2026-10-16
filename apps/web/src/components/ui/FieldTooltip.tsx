/**
 * Field tooltip — help text on hover / focus
 */

import { useId, useState } from 'react';
import { CircleHelp } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FieldTooltipProps {
  content: string;
  className?: string;
}

export function FieldTooltip({ content, className }: FieldTooltipProps) {
  const [open, setOpen] = useState(false);
  const tipId = useId();

  return (
    <span className={cn('relative inline-flex align-middle', className)}>
      <button
        type="button"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted transition hover:bg-accent-soft hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        aria-label="Bantuan"
        aria-describedby={open ? tipId : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={(e) => {
          e.preventDefault();
          setOpen((v) => !v);
        }}
      >
        <CircleHelp className="h-3.5 w-3.5" />
      </button>

      {open && (
        <span
          id={tipId}
          role="tooltip"
          className="absolute bottom-[calc(100%+8px)] left-1/2 z-50 w-56 -translate-x-1/2 rounded-xl border border-line bg-surface px-3 py-2 text-left text-xs font-medium leading-relaxed text-ink shadow-[var(--shadow-lift)] sm:w-64"
        >
          {content}
          <span className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-x-[6px] border-t-[6px] border-x-transparent border-t-surface drop-shadow-sm" />
        </span>
      )}
    </span>
  );
}

export function FieldLabel({
  htmlFor,
  children,
  tooltip,
  className,
}: {
  htmlFor?: string;
  children: React.ReactNode;
  tooltip?: string;
  className?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn('mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-ink', className)}
    >
      <span>{children}</span>
      {tooltip && <FieldTooltip content={tooltip} />}
    </label>
  );
}
