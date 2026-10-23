/**
 * Field tooltip — help text on hover / focus.
 * Rendered on document.body so modal overflow does not clip it.
 */

import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CircleHelp } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FieldTooltipProps {
  content: string;
  className?: string;
}

function placeTooltip(anchor: HTMLElement) {
  const rect = anchor.getBoundingClientRect();
  const width = Math.min(280, window.innerWidth - 24);
  let left = rect.left;
  if (left + width > window.innerWidth - 12) {
    left = window.innerWidth - 12 - width;
  }
  if (left < 12) left = 12;

  const below = rect.bottom + 8;
  const above = rect.top - 8;
  const openBelow = below + 96 < window.innerHeight - 8;
  return {
    top: openBelow ? below : Math.max(8, above),
    left,
    width,
    placement: openBelow ? ('below' as const) : ('above' as const),
  };
}

export function FieldTooltip({ content, className }: FieldTooltipProps) {
  const [open, setOpen] = useState(false);
  const [box, setBox] = useState<ReturnType<typeof placeTooltip> | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const tipId = useId();

  useEffect(() => {
    if (!open || !buttonRef.current) return;
    const update = () => {
      if (buttonRef.current) setBox(placeTooltip(buttonRef.current));
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open]);

  return (
    <span className={cn('relative inline-flex align-middle', className)}>
      <button
        ref={buttonRef}
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

      {open &&
        box &&
        createPortal(
          <span
            id={tipId}
            role="tooltip"
            style={{ top: box.top, left: box.left, width: box.width }}
            className={cn(
              'fixed z-[80] whitespace-normal break-words rounded-xl border border-line bg-surface px-3 py-2 text-left text-xs font-medium leading-relaxed text-ink shadow-[var(--shadow-lift)]',
              box.placement === 'above' && '-translate-y-full'
            )}
          >
            {content}
          </span>,
          document.body
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
