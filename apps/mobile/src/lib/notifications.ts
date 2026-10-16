/**
 * Local push notifications for budget alerts and reminders.
 * Gracefully degrades in Expo Go (no-op).
 */

import Constants from 'expo-constants';
import type { BudgetStatus } from './budget';

const isExpoGo = Constants.appOwnership === 'expo';

let Notifications: typeof import('expo-notifications') | null = null;

async function loadNotifications() {
  if (isExpoGo || Notifications) return Notifications;
  try {
    Notifications = await import('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch {
    Notifications = null;
  }
  return Notifications;
}

export async function requestNotificationPermission(): Promise<boolean> {
  const mod = await loadNotifications();
  if (!mod) return false;

  const { status: existing } = await mod.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await mod.requestPermissionsAsync();
  return status === 'granted';
}

export async function checkAndNotifyBudgetAlert(budget: BudgetStatus): Promise<void> {
  if (!budget.hasBudget) return;

  const pct = budget.percentUsed;
  const mod = await loadNotifications();
  if (!mod) return;

  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  if (pct >= 100) {
    await mod.scheduleNotificationAsync({
      content: {
        title: '⚠️ Budget Terlampaui!',
        body: `Pengeluaran kamu sudah ${pct}% dari budget bulan ini. Kurangi pengeluaran ya!`,
        data: { type: 'budget_over' },
      },
      trigger: null,
    });
  } else if (pct >= 80) {
    await mod.scheduleNotificationAsync({
      content: {
        title: '📊 Budget Hampir Habis',
        body: `Pengeluaran sudah mencapai ${pct}% dari budget. Sisa ${formatCompact(budget.totalRemaining)}.`,
        data: { type: 'budget_warning' },
      },
      trigger: null,
    });
  }
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}jt`;
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}rb`;
  return `Rp ${n}`;
}

export async function cancelAllNotifications(): Promise<void> {
  const mod = await loadNotifications();
  if (!mod) return;
  await mod.cancelAllScheduledNotificationsAsync();
}
