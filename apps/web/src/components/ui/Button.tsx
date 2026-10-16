/**
 * Dompet Tenang - Button Component
 */

import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gradient' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  animated?: boolean;
}

const variantStyles = {
  primary:
    'bg-accent text-white hover:brightness-95 shadow-md shadow-accent/20 focus-visible:ring-accent disabled:bg-accent/40',
  secondary:
    'bg-[var(--color-sidebar)] text-white hover:brightness-110 focus-visible:ring-accent disabled:opacity-40',
  outline:
    'border border-line bg-surface text-ink hover:border-accent/40 hover:bg-accent-soft/50 focus-visible:ring-accent disabled:opacity-50',
  ghost:
    'text-muted hover:bg-mist-deep hover:text-ink focus-visible:ring-accent disabled:opacity-40',
  danger:
    'bg-coral text-white hover:bg-red-600 shadow-md shadow-coral/20 focus-visible:ring-coral disabled:bg-coral/40',
  gradient:
    'bg-gradient-to-r from-accent to-accent-bright text-white shadow-md shadow-accent/25 hover:brightness-105 focus-visible:ring-accent disabled:opacity-50',
  glass:
    'border border-white/25 bg-white/15 text-white backdrop-blur-md hover:bg-white/25 focus-visible:ring-white/40 disabled:opacity-50',
};

const sizeStyles = {
  sm: 'h-9 px-3 text-sm rounded-xl',
  md: 'h-11 px-4 text-sm rounded-xl sm:text-base',
  lg: 'h-12 px-5 text-base rounded-2xl sm:h-13',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      animated: _animated = true,
      type = 'button',
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:active:scale-100',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : leftIcon}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
