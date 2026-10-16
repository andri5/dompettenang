/**
 * Shared user avatar (image or initials)
 */

import { useAuthenticatedFileUrl } from '@/hooks/useAuthenticatedFileUrl';
import { cn, getInitials } from '@/lib/utils';

interface UserAvatarProps {
  name?: string | null;
  avatar?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeStyles = {
  sm: 'h-9 w-9 text-xs rounded-xl',
  md: 'h-10 w-10 text-sm rounded-xl',
  lg: 'h-20 w-20 text-2xl rounded-[1.4rem]',
  xl: 'h-24 w-24 text-3xl rounded-[1.4rem]',
};

export function UserAvatar({
  name,
  avatar,
  size = 'md',
  className,
}: UserAvatarProps) {
  const { url: src } = useAuthenticatedFileUrl(avatar);

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        className={cn(
          'flex-shrink-0 object-cover ring-2 ring-accent/20',
          sizeStyles[size],
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        'brand-mark flex flex-shrink-0 items-center justify-center font-display font-bold text-ink',
        sizeStyles[size],
        className
      )}
    >
      {name ? getInitials(name) : 'U'}
    </div>
  );
}
