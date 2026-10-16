type StatusKind = 'offline' | 'server' | 'maintenance';

type StatusEvent = { type: StatusKind; message?: string };

type Listener = (event: StatusEvent) => void;

const listeners = new Set<Listener>();
let lastEmitAt: Partial<Record<StatusKind, number>> = {};

/** Dedup rapid repeats (e.g. many failed requests) */
const DEDUP_MS = 4000;

export function subscribeAppStatus(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitAppStatus(event: StatusEvent) {
  const now = Date.now();
  const prev = lastEmitAt[event.type] || 0;
  if (now - prev < DEDUP_MS) return;
  lastEmitAt[event.type] = now;
  listeners.forEach((l) => l(event));
}

export function resetAppStatusDedup() {
  lastEmitAt = {};
}
