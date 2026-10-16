/**
 * Dompet Tenang - Select Component
 */

import { forwardRef, useState } from 'react';
import type { SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FieldTooltip } from './FieldTooltip';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  tooltip?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
  animated?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      tooltip,
      error,
      helperText,
      options,
      placeholder,
      id,
      onFocus,
      onBlur,
      animated: _animated,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const selectId = id || props.name;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-ink"
          >
            <span>{label}</span>
            {tooltip && <FieldTooltip content={tooltip} />}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'w-full appearance-none rounded-2xl border border-line bg-surface px-4 py-3 pr-11 text-sm text-ink transition-all focus:outline-none sm:text-base',
              isFocused && 'border-accent ring-2 ring-accent/15',
              error && 'border-coral ring-2 ring-coral/15',
              className
            )}
            onFocus={(e) => {
              setIsFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              onBlur?.(e);
            }}
            {...props}
          >
            {placeholder && (
              <option value="" disabled={props.required}>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        </div>
        {error && <p className="mt-1.5 text-sm text-coral">{error}</p>}
        {helperText && !error && <p className="mt-1.5 text-sm text-muted">{helperText}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
