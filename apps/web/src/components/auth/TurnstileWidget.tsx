/**
 * Cloudflare Turnstile widget (explicit render)
 * Shared script loader — safe with React Strict Mode remounts.
 * Falls back to a local checkbox when using Cloudflare dummy test sitekey
 * and the CDN script cannot load (adblocker / network).
 */

import { useEffect, useRef, useState } from 'react';

const SCRIPT_ID = 'cf-turnstile-script';
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

/** Cloudflare always-pass dummy sitekey (local testing) */
const CF_TEST_SITEKEY = '1x00000000000000000000AA';
const DEV_FALLBACK_TOKEN = 'XXXX.DUMMY.TOKEN.TEST';

type TurnstileApi = {
  render: (
    el: HTMLElement,
    opts: {
      sitekey: string;
      callback?: (token: string) => void;
      'expired-callback'?: () => void;
      'error-callback'?: () => void;
      theme?: 'light' | 'dark' | 'auto';
    }
  ) => string;
  remove: (widgetId: string) => void;
  ready?: (cb: () => void) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let turnstileLoader: Promise<TurnstileApi> | null = null;

function waitForTurnstileApi(timeoutMs = 10000): Promise<TurnstileApi> {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const tick = () => {
      if (window.turnstile) {
        resolve(window.turnstile);
        return;
      }
      if (Date.now() - started > timeoutMs) {
        reject(new Error('Turnstile API timeout'));
        return;
      }
      window.setTimeout(tick, 40);
    };
    tick();
  });
}

function loadTurnstileScript(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (turnstileLoader) return turnstileLoader;

  turnstileLoader = new Promise<TurnstileApi>((resolve, reject) => {
    const finish = async () => {
      try {
        resolve(await waitForTurnstileApi());
      } catch (err) {
        turnstileLoader = null;
        reject(err);
      }
    };

    const fail = (err: Error) => {
      turnstileLoader = null;
      reject(err);
    };

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      if (window.turnstile) {
        resolve(window.turnstile);
        return;
      }
      if (existing.dataset.loaded === '1') {
        void finish();
        return;
      }
      existing.addEventListener(
        'load',
        () => {
          existing.dataset.loaded = '1';
          void finish();
        },
        { once: true }
      );
      existing.addEventListener(
        'error',
        () => fail(new Error('Turnstile script failed')),
        { once: true }
      );
      void finish();
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      script.dataset.loaded = '1';
      void finish();
    };
    script.onerror = () => fail(new Error('Turnstile script failed'));
    document.head.appendChild(script);
  });

  return turnstileLoader;
}

type Props = {
  siteKey: string;
  onToken: (token: string | null) => void;
  className?: string;
};

export function TurnstileWidget({ siteKey, onToken, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;
  const [loadError, setLoadError] = useState<string | null>(null);
  const [useFallback, setUseFallback] = useState(false);
  const [fallbackChecked, setFallbackChecked] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const allowFallback = siteKey === CF_TEST_SITEKEY;

  useEffect(() => {
    let cancelled = false;
    setLoadError(null);
    setUseFallback(false);
    setFallbackChecked(false);

    const mount = async () => {
      try {
        const turnstile = await loadTurnstileScript();
        if (cancelled || !containerRef.current) return;

        const doRender = () => {
          if (cancelled || !containerRef.current || !window.turnstile) return;
          if (widgetIdRef.current) {
            try {
              window.turnstile.remove(widgetIdRef.current);
            } catch {
              /* ignore */
            }
            widgetIdRef.current = null;
          }
          containerRef.current.innerHTML = '';
          widgetIdRef.current = window.turnstile.render(containerRef.current, {
            sitekey: siteKey,
            callback: (token) => onTokenRef.current(token),
            'expired-callback': () => onTokenRef.current(null),
            'error-callback': () => {
              if (!cancelled) {
                if (allowFallback) {
                  setUseFallback(true);
                } else {
                  setLoadError('Captcha gagal diverifikasi. Ketuk Coba lagi.');
                }
              }
              onTokenRef.current(null);
            },
            theme: 'light',
          });
        };

        if (typeof turnstile.ready === 'function') {
          turnstile.ready(doRender);
        } else {
          doRender();
        }
      } catch {
        if (cancelled) return;
        if (allowFallback) {
          setUseFallback(true);
          setLoadError(null);
        } else {
          setLoadError(
            'Gagal memuat captcha. Periksa koneksi / matikan adblocker, lalu Coba lagi.'
          );
          onTokenRef.current(null);
        }
      }
    };

    void mount();

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          /* ignore */
        }
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, retryCount, allowFallback]);

  if (useFallback) {
    return (
      <div className={className}>
        <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-line bg-mist/40 px-3 py-3 text-sm text-ink">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-line text-accent focus:ring-accent"
            checked={fallbackChecked}
            onChange={(e) => {
              const checked = e.target.checked;
              setFallbackChecked(checked);
              onToken(checked ? DEV_FALLBACK_TOKEN : null);
            }}
          />
          <span>
            Saya bukan robot{' '}
            <span className="text-xs text-muted">(mode uji lokal — CDN Turnstile tidak termuat)</span>
          </span>
        </label>
        <button
          type="button"
          className="mt-2 text-xs font-semibold text-accent underline"
          onClick={() => {
            turnstileLoader = null;
            setUseFallback(false);
            setRetryCount((n) => n + 1);
          }}
        >
          Coba muat captcha Cloudflare
        </button>
      </div>
    );
  }

  return (
    <div className={className}>
      <div ref={containerRef} style={{ minHeight: 65 }} />
      {loadError && (
        <div className="mt-2 space-y-1 text-center">
          <p className="text-xs text-coral">{loadError}</p>
          <button
            type="button"
            className="text-xs font-semibold text-accent underline"
            onClick={() => {
              turnstileLoader = null;
              setRetryCount((n) => n + 1);
            }}
          >
            Coba lagi
          </button>
        </div>
      )}
    </div>
  );
}
