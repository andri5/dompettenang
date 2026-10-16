/**
 * Dompet Tenang - Badge Component
 */

import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'accent';
  size?: 'sm' | 'md';
}

const variantStyles = {
  default: 'bg-mist-deep text-muted',
  primary: 'bg-accent-soft text-accent',
  secondary: 'bg-ink/5 text-ink',
  success: 'bg-lime-soft text-lime',
  warning: 'bg-amber-soft text-amber',
  danger: 'bg-coral-soft text-coral',
  info: 'bg-accent-soft text-accent',
  accent: 'bg-accent-soft text-accent',
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-lg font-semibold',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';
