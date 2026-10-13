/**
 * One-time welcome prompt after registration (mobile)
 */

import * as SecureStore from 'expo-secure-store';

const PENDING_KEY = 'dt_welcome_pending';
/** v2: only written after the dialog is actually shown (avoids race with focus cleanup). */
const SHOWN_PREFIX = 'dt_welcome_shown_v2_';

export const WELCOME_COPY = {
  title: 'Selamat datang',
  message:
    'Yuk mulai catatan harian pemasukan dan pengeluaranmu hari ini.',
  confirmLabel: 'Mulai catat',
} as const;

/** Survives SecureStore flakiness and is set synchronously before navigation. */
let memoryPending = false;

export function markWelcomePendingSync() {
  memoryPending = true;
}

export async function markWelcomePending() {
  memoryPending = true;
  try {
    await SecureStore.setItemAsync(PENDING_KEY, '1');
  } catch {
    /* ignore — memory flag is enough for this session */
  }
}

export async function shouldShowWelcome(user: {
  id: string;
  createdAt?: string | Date | null;
}): Promise<boolean> {
  if (memoryPending) return true;
  try {
    if ((await SecureStore.getItemAsync(PENDING_KEY)) === '1') return true;

    const shown = await SecureStore.getItemAsync(`${SHOWN_PREFIX}${user.id}`);
    if (shown) return false;

    // Recover accounts that registered while the focus-race bug cleared pending without UI.
    if (!user.createdAt) return false;
    const ageMs = Date.now() - new Date(user.createdAt).getTime();
    return ageMs >= 0 && ageMs < 2 * 60 * 60 * 1000;
  } catch {
    return memoryPending;
  }
}

/** Call only after the welcome dialog has been presented. */
export async function markWelcomeShown(userId?: string | null) {
  memoryPending = false;
  try {
    await SecureStore.deleteItemAsync(PENDING_KEY);
  } catch {
    /* ignore */
  }
  if (userId) {
    try {
      await SecureStore.setItemAsync(`${SHOWN_PREFIX}${userId}`, '1');
    } catch {
      /* ignore */
    }
  }
}
