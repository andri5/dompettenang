/**
 * Dompet Tenang - Input Component
 */

import { forwardRef, useState } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { FieldTooltip } from './FieldTooltip';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  tooltip?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'glass';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      tooltip,
      error,
      helperText,
      leftIcon,
      rightIcon,
      variant = 'default',
      id,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const inputId = id || props.name;
    const isGlass = variant === 'glass';

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'mb-1.5 flex items-center gap-1.5 text-sm font-semibold',
              isGlass ? 'text-white/85' : 'text-ink'
            )}
          >
            <span>{label}</span>
            {tooltip && <FieldTooltip content={tooltip} />}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div
              className={cn(
                'pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5',
                isGlass ? 'text-white/55' : 'text-muted',
                isFocused && (isGlass ? 'text-accent-bright' : 'text-accent')
              )}
            >
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full rounded-2xl px-4 py-3 text-sm transition-all duration-200 focus:outline-none disabled:cursor-not-allowed sm:text-base',
              leftIcon ? 'pl-11' : '',
              rightIcon ? 'pr-11' : '',
              props.type === 'date' &&
                'min-h-[48px] appearance-none leading-normal sm:min-h-[52px] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-70',
              isGlass
                ? cn(
                    'border border-white/20 bg-white/10 text-white placeholder:text-white/40',
                    isFocused && 'border-accent-bright/60 bg-white/15 ring-2 ring-accent/30',
                    error && 'border-red-300/70'
                  )
                : cn(
                    'border border-line bg-surface text-ink placeholder:text-muted/70',
                    isFocused && 'border-accent ring-2 ring-accent/15',
                    error && 'border-coral ring-2 ring-coral/15',
                    'disabled:bg-mist disabled:text-muted'
                  ),
              className
            )}
            {...props}
            onFocus={(e) => {
              setIsFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              onBlur?.(e);
            }}
          />

          {rightIcon && (
            <div
              className={cn(
                'absolute inset-y-0 right-0 flex items-center pr-3.5',
                isGlass ? 'text-white/55' : 'text-muted'
              )}
            >
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p className={cn('mt-1.5 text-sm', isGlass ? 'text-red-200' : 'text-coral')}>
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className={cn('mt-1.5 text-sm', isGlass ? 'text-white/55' : 'text-muted')}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
