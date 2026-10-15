/**
 * Pro entitlement helpers
 * - ADMIN always has Pro (gratis)
 * - USER has Pro when plan=PRO and not expired
 */

export type PlanCode = 'FREE' | 'PRO';

export type PlanUserLike = {
  role?: string | null;
  plan?: PlanCode | string | null;
  proExpiresAt?: Date | string | null;
};

export function hasProAccess(user: PlanUserLike): boolean {
  if (user.role === 'ADMIN') return true;

  if (user.plan !== 'PRO') return false;

  if (!user.proExpiresAt) return true;

  const expires =
    user.proExpiresAt instanceof Date
      ? user.proExpiresAt
      : new Date(user.proExpiresAt);

  if (Number.isNaN(expires.getTime())) return false;
  return expires.getTime() > Date.now();
}

export function effectivePlan(user: PlanUserLike): PlanCode {
  return hasProAccess(user) ? 'PRO' : 'FREE';
}
