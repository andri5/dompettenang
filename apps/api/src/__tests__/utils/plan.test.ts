import { describe, expect, it } from 'vitest';
import { effectivePlan, hasProAccess } from '../../utils/plan.js';

describe('hasProAccess', () => {
  it('grants Pro to ADMIN regardless of plan', () => {
    expect(hasProAccess({ role: 'ADMIN', plan: 'FREE' })).toBe(true);
    expect(effectivePlan({ role: 'ADMIN', plan: 'FREE' })).toBe('PRO');
  });

  it('denies Pro for FREE users', () => {
    expect(hasProAccess({ role: 'USER', plan: 'FREE' })).toBe(false);
    expect(effectivePlan({ role: 'USER', plan: 'FREE' })).toBe('FREE');
  });

  it('grants Pro for active PRO without expiry', () => {
    expect(hasProAccess({ role: 'USER', plan: 'PRO', proExpiresAt: null })).toBe(
      true
    );
  });

  it('grants Pro for PRO with future expiry', () => {
    const future = new Date(Date.now() + 86_400_000);
    expect(hasProAccess({ role: 'USER', plan: 'PRO', proExpiresAt: future })).toBe(
      true
    );
  });

  it('denies Pro for PRO with past expiry', () => {
    const past = new Date(Date.now() - 86_400_000);
    expect(hasProAccess({ role: 'USER', plan: 'PRO', proExpiresAt: past })).toBe(
      false
    );
  });
});
