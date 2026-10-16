/**
 * Visit analytics — mirrors web VisitTracker for mobile navigation
 */

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import type { NavigationState, PartialState } from '@react-navigation/native';
import { api } from './api';

const SESSION_KEY = 'dt_visit_sid';
let lastPath: string | null = null;
let sessionIdCache: string | null = null;

async function getSessionId(): Promise<string> {
  if (sessionIdCache) return sessionIdCache;
  try {
    let id = await SecureStore.getItemAsync(SESSION_KEY);
    if (!id) {
      id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      await SecureStore.setItemAsync(SESSION_KEY, id);
    }
    sessionIdCache = id;
    return id;
  } catch {
    return 'anon-mobile';
  }
}

function getActiveRouteName(
  state?: NavigationState | PartialState<NavigationState> | undefined
): string | null {
  if (!state || !state.routes || state.routes.length === 0) return null;
  const index = typeof state.index === 'number' ? state.index : state.routes.length - 1;
  const route = state.routes[index];
  if (!route) return null;
  if (route.state) {
    const nested = getActiveRouteName(route.state as NavigationState);
    if (nested) return nested;
  }
  return route.name;
}

export async function recordVisit(path: string) {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (lastPath === normalized) return;
  lastPath = normalized;

  try {
    const sessionId = await getSessionId();
    await api.post('/analytics/visit', {
      path: normalized,
      sessionId,
      source: 'mobile',
      deviceType: Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'mobile',
    });
  } catch {
    // analytics must never break UX
  }
}

export function trackNavigationState(
  state?: NavigationState | PartialState<NavigationState> | undefined
) {
  const name = getActiveRouteName(state);
  if (!name) return;
  void recordVisit(name);
}
