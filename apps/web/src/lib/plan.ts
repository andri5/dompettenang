/**
 * Client-side Pro entitlement helpers (mirrors API rules).
 */

import type { User } from '@/types';

export function hasProAccess(user: User | null | undefined): boolean {
  if (!user) return false;
  if (user.hasPro === true) return true;
  if (user.role === 'ADMIN') return true;
  if (user.plan !== 'PRO') return false;
  if (!user.proExpiresAt) return true;
  const expires = new Date(user.proExpiresAt);
  if (Number.isNaN(expires.getTime())) return false;
  return expires.getTime() > Date.now();
}
