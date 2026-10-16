/**
 * Dompet Tenang - Page Header
 */

import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  eyebrow?: string;
}

export function PageHeader({ title, description, action, eyebrow }: PageHeaderProps) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:mb-8 sm:gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-accent sm:mb-1.5 sm:text-[11px] sm:tracking-[0.22em]">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-[1.65rem] font-bold leading-tight tracking-[-0.04em] text-ink sm:text-4xl lg:text-[2.75rem]">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 line-clamp-2 max-w-2xl text-sm text-muted sm:mt-2 sm:line-clamp-none sm:text-base">
            {description}
          </p>
        )}
      </div>
      {action && <div className="flex w-full flex-shrink-0 sm:w-auto">{action}</div>}
    </div>
  );
}
