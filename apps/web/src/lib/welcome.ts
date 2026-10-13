/**
 * One-time welcome prompt after registration
 */

const PENDING_KEY = 'dt_welcome_pending';
const SEEN_PREFIX = 'dt_welcome_seen_';

export const WELCOME_COPY = {
  title: 'Selamat datang',
  message:
    'Yuk mulai catatan harian pemasukan dan pengeluaranmu hari ini.',
  confirmLabel: 'Mulai catat',
} as const;

export function markWelcomePending() {
  try {
    localStorage.setItem(PENDING_KEY, '1');
  } catch {
    /* ignore */
  }
}

/** Returns true once if welcome should show, then clears pending + marks seen. */
export function consumeWelcomePending(userId?: string | null): boolean {
  try {
    const pending = localStorage.getItem(PENDING_KEY) === '1';
    if (!pending) return false;
    localStorage.removeItem(PENDING_KEY);
    if (userId) {
      localStorage.setItem(`${SEEN_PREFIX}${userId}`, '1');
    }
    return true;
  } catch {
    return false;
  }
}
