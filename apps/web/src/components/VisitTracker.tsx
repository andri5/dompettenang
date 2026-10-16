import { useEffect, useRef } from 'react';
import api from '@/lib/api';

const SESSION_KEY = 'dd_visit_sid';

function getSessionId() {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return 'anon';
  }
}

function recordVisit(path: string) {
  const sessionId = getSessionId();
  void api
    .post('/analytics/visit', {
      path,
      sessionId,
      source: 'web',
      deviceType: window.innerWidth < 768 ? 'mobile' : 'desktop',
    })
    .catch(() => undefined);
}

export function VisitTracker() {
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    const track = () => {
      const path = window.location.pathname || '/';
      if (lastPath.current === path) return;
      lastPath.current = path;
      recordVisit(path);
    };

    track();

    const origPush = history.pushState.bind(history);
    const origReplace = history.replaceState.bind(history);

    history.pushState = ((...args: Parameters<History['pushState']>) => {
      origPush(...args);
      track();
    }) as History['pushState'];

    history.replaceState = ((...args: Parameters<History['replaceState']>) => {
      origReplace(...args);
      track();
    }) as History['replaceState'];

    window.addEventListener('popstate', track);
    return () => {
      history.pushState = origPush;
      history.replaceState = origReplace;
      window.removeEventListener('popstate', track);
    };
  }, []);

  return null;
}
