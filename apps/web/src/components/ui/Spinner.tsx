/**
 * Dompet Tenang - Loading Spinner
 */

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  color?: 'primary' | 'secondary' | 'success';
}

const sizeStyles = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

const colorStyles = {
  primary: 'text-accent',
  secondary: 'text-ink',
  success: 'text-lime',
};

export function Spinner({ size = 'md', className, color = 'primary' }: SpinnerProps) {
  return (
    <Loader2
      className={cn('animate-spin', sizeStyles[size], colorStyles[color], className)}
    />
  );
}

export interface LoadingProps {
  message?: string;
}

export function Loading({ message = 'Memuat...' }: LoadingProps) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-3">
      <Spinner size="lg" />
      <p className="text-sm text-muted">{message}</p>
    </div>
  );
}

export function LoadingOverlay({ message = 'Memuat...' }: LoadingProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-muted">{message}</p>
      </div>
    </div>
  );
}
