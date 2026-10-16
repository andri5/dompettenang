/**
 * Offline mutation queue — persists pending writes in SecureStore,
 * flushes to API when connectivity returns.
 */

import * as SecureStore from 'expo-secure-store';
import NetInfo from '@react-native-community/netinfo';
import { createTransaction, updateTransaction } from './finance';

const QUEUE_KEY = 'dt_offline_queue';

export type OfflineAction =
  | {
      id: string;
      type: 'CREATE_TRANSACTION';
      payload: {
        amount: number;
        categoryId: string;
        type: 'EXPENSE' | 'INCOME';
        date: string;
        description?: string;
        receiptUrl?: string | null;
      };
      createdAt: string;
    }
  | {
      id: string;
      type: 'UPDATE_TRANSACTION';
      payload: {
        transactionId: string;
        amount: number;
        categoryId: string;
        type: 'EXPENSE' | 'INCOME';
        date: string;
        description?: string;
        receiptUrl?: string | null;
      };
      createdAt: string;
    };

export async function isDeviceOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  if (state.isConnected === false) return false;
  if (state.isInternetReachable === false) return false;
  return true;
}

async function readQueue(): Promise<OfflineAction[]> {
  try {
    const raw = await SecureStore.getItemAsync(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as OfflineAction[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeQueue(items: OfflineAction[]): Promise<void> {
  if (items.length === 0) {
    await SecureStore.deleteItemAsync(QUEUE_KEY);
  } else {
    await SecureStore.setItemAsync(QUEUE_KEY, JSON.stringify(items));
  }
}

export async function enqueueOfflineAction(
  action: Omit<OfflineAction, 'id' | 'createdAt'>
): Promise<OfflineAction> {
  const queue = await readQueue();
  const entry: OfflineAction = {
    ...action,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  } as OfflineAction;
  queue.push(entry);
  await writeQueue(queue);
  return entry;
}

export async function getOfflineQueue(): Promise<OfflineAction[]> {
  return readQueue();
}

export async function clearOfflineQueue(): Promise<void> {
  await SecureStore.deleteItemAsync(QUEUE_KEY);
}

export async function flushOfflineQueue(): Promise<{ flushed: number; remaining: number }> {
  const queue = await readQueue();
  if (queue.length === 0) return { flushed: 0, remaining: 0 };

  const failed: OfflineAction[] = [];
  let flushed = 0;

  for (const action of queue) {
    try {
      if (action.type === 'CREATE_TRANSACTION') {
        await createTransaction(action.payload);
        flushed++;
      } else if (action.type === 'UPDATE_TRANSACTION') {
        const { transactionId, ...rest } = action.payload;
        await updateTransaction(transactionId, rest);
        flushed++;
      }
    } catch {
      failed.push(action);
    }
  }

  await writeQueue(failed);
  return { flushed, remaining: failed.length };
}
