/**
 * Dompet Tenang - Category Icon
 * Renders Lucide icons (theme) with emoji fallback for legacy data
 */

import type { LucideIcon } from 'lucide-react';
import {
  Utensils,
  Car,
  ShoppingBag,
  Gamepad2,
  HeartPulse,
  GraduationCap,
  Home,
  Zap,
  Plane,
  Gift,
  MoreHorizontal,
  Wallet,
  Briefcase,
  Laptop,
  LineChart,
  PiggyBank,
  Sparkles,
  Banknote,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, LucideIcon> = {
  utensils: Utensils,
  car: Car,
  'shopping-bag': ShoppingBag,
  'gamepad-2': Gamepad2,
  'heart-pulse': HeartPulse,
  'graduation-cap': GraduationCap,
  home: Home,
  zap: Zap,
  plane: Plane,
  gift: Gift,
  'more-horizontal': MoreHorizontal,
  wallet: Wallet,
  briefcase: Briefcase,
  laptop: Laptop,
  'line-chart': LineChart,
  'piggy-bank': PiggyBank,
  sparkles: Sparkles,
  banknote: Banknote,
};

const EMOJI_TO_KEY: Record<string, string> = {
  '🍽️': 'utensils',
  '🍔': 'utensils',
  '🚗': 'car',
  '🛍️': 'shopping-bag',
  '🛒': 'shopping-bag',
  '🎮': 'gamepad-2',
  '🎬': 'gamepad-2',
  '❤️': 'heart-pulse',
  '🏥': 'heart-pulse',
  '🎓': 'graduation-cap',
  '📚': 'graduation-cap',
  '🏠': 'home',
  '⚡': 'zap',
  '💡': 'zap',
  '✈️': 'plane',
  '🎁': 'gift',
  '👕': 'shopping-bag',
  '📁': 'more-horizontal',
  '💼': 'briefcase',
  '💰': 'banknote',
  '💻': 'laptop',
  '📈': 'line-chart',
  '📊': 'line-chart',
  '✨': 'sparkles',
};

export const CATEGORY_ICON_OPTIONS = [
  'utensils',
  'car',
  'shopping-bag',
  'gamepad-2',
  'heart-pulse',
  'graduation-cap',
  'home',
  'zap',
  'plane',
  'gift',
  'wallet',
  'banknote',
  'briefcase',
  'laptop',
  'line-chart',
  'piggy-bank',
  'sparkles',
  'more-horizontal',
] as const;

export type CategoryIconName = (typeof CATEGORY_ICON_OPTIONS)[number];

function resolveIconKey(icon?: string | null): string | null {
  if (!icon) return null;
  if (ICON_MAP[icon]) return icon;
  return EMOJI_TO_KEY[icon] || null;
}

interface CategoryIconProps {
  icon?: string | null;
  className?: string;
  size?: number;
}

export function CategoryIcon({ icon, className, size = 20 }: CategoryIconProps) {
  const key = resolveIconKey(icon);
  const Lucide = key ? ICON_MAP[key] : null;

  if (Lucide) {
    return <Lucide className={cn('shrink-0', className)} size={size} strokeWidth={2.25} />;
  }

  // Legacy unknown emoji/text fallback
  if (icon && icon.length <= 4) {
    return (
      <span className={cn('inline-flex leading-none', className)} style={{ fontSize: size }}>
        {icon}
      </span>
    );
  }

  return <Wallet className={cn('shrink-0', className)} size={size} strokeWidth={2.25} />;
}
