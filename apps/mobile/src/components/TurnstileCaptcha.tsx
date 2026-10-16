/**
 * Cloudflare Turnstile for Expo — WebView + local test-key fallback
 */

import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { useColors } from '../themeContext';

const CF_TEST_SITEKEY = '1x00000000000000000000AA';
const DEV_FALLBACK_TOKEN = 'XXXX.DUMMY.TOKEN.TEST';

type Props = {
  siteKey: string;
  onToken: (token: string | null) => void;
  resetKey?: number;
};

function buildHtml(siteKey: string, bg: string): string {
  const safeKey = siteKey.replace(/[^a-zA-Z0-9_-]/g, '');
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
  <style>
    html, body {
      margin: 0; padding: 8px 0;
      background: ${bg};
      display: flex; align-items: center; justify-content: center;
      min-height: 100%;
      font-family: -apple-system, sans-serif;
    }
    #cf-turnstile { min-height: 65px; }
  </style>
  <script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" async defer></script>
</head>
<body>
  <div id="cf-turnstile"></div>
  <script>
    function post(payload) {
      try {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify(payload));
        }
      } catch (e) {}
    }
    var done = false;
    function fail(msg) {
      if (done) return;
      done = true;
      post({ type: 'error', message: msg || 'load_failed' });
    }
    function mount() {
      if (!window.turnstile) return;
      try {
        window.turnstile.render('#cf-turnstile', {
          sitekey: '${safeKey}',
          callback: function (token) {
            done = true;
            post({ type: 'token', token: token });
          },
          'expired-callback': function () { post({ type: 'token', token: null }); },
          'error-callback': function () { fail('widget_error'); },
          theme: 'light'
        });
        post({ type: 'ready' });
      } catch (e) {
        fail('render_error');
      }
    }
    var tries = 0;
    function wait() {
      if (window.turnstile) {
        if (typeof window.turnstile.ready === 'function') window.turnstile.ready(mount);
        else mount();
        return;
      }
      tries += 1;
      if (tries > 100) {
        fail('timeout');
        return;
      }
      setTimeout(wait, 50);
    }
    wait();
    setTimeout(function () { if (!done) fail('timeout'); }, 12000);
  </script>
</body>
</html>`;
}

export function TurnstileCaptcha({ siteKey, onToken, resetKey = 0 }: Props) {
  const colors = useColors();
  const [loading, setLoading] = useState(true);
  const [useFallback, setUseFallback] = useState(false);
  const [fallbackOn, setFallbackOn] = useState(false);
  const [retry, setRetry] = useState(0);
  const allowFallback = siteKey === CF_TEST_SITEKEY;
  const html = useMemo(
    () => buildHtml(siteKey, colors.surface),
    [siteKey, colors.surface, resetKey, retry]
  );

  useEffect(() => {
    setLoading(true);
    setUseFallback(false);
    setFallbackOn(false);
    onToken(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only on remount keys
  }, [siteKey, resetKey, retry]);

  const goFallback = () => {
    if (!allowFallback) return;
    setLoading(false);
    setUseFallback(true);
    setFallbackOn(false);
    onToken(null);
  };

  const onMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data) as {
        type: string;
        token?: string | null;
      };
      if (data.type === 'ready') {
        setLoading(false);
      } else if (data.type === 'token') {
        setLoading(false);
        onToken(data.token ?? null);
      } else if (data.type === 'error') {
        if (allowFallback) goFallback();
        else {
          setLoading(false);
          onToken(null);
        }
      }
    } catch {
      /* ignore */
    }
  };

  if (useFallback) {
    return (
      <View style={[styles.wrap, styles.fallbackBox, { borderColor: colors.border, backgroundColor: colors.mistDeep }]}>
        <View style={styles.fallbackRow}>
          <Switch
            value={fallbackOn}
            onValueChange={(v) => {
              setFallbackOn(v);
              onToken(v ? DEV_FALLBACK_TOKEN : null);
            }}
            trackColor={{ false: colors.border, true: colors.brandSoft }}
            thumbColor={fallbackOn ? colors.brand : colors.faint}
          />
          <View style={{ flex: 1 }}>
            <Text style={[styles.fallbackTitle, { color: colors.text }]}>Saya bukan robot</Text>
            <Text style={[styles.fallbackHint, { color: colors.muted }]}>
              Mode uji lokal (CDN Turnstile tidak termuat di WebView)
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => {
            setUseFallback(false);
            setRetry((n) => n + 1);
          }}
        >
          <Text style={[styles.retry, { color: colors.brand }]}>Coba muat captcha Cloudflare</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.brand} />
          <Text style={[styles.hint, { color: colors.muted }]}>Memuat captcha…</Text>
        </View>
      ) : null}
      <WebView
        key={`${siteKey}-${resetKey}-${retry}`}
        originWhitelist={['*']}
        source={{
          html,
          // Use a real-looking origin; localhost often breaks Turnstile
          baseUrl: 'https://dompettenang.app',
        }}
        onMessage={onMessage}
        onError={() => {
          if (allowFallback) goFallback();
          else {
            setLoading(false);
            onToken(null);
          }
        }}
        onHttpError={() => {
          if (allowFallback) goFallback();
        }}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        thirdPartyCookiesEnabled
        sharedCookiesEnabled
        style={[styles.webview, { opacity: loading ? 0 : 1 }]}
        scrollEnabled={false}
        setSupportMultipleWindows={false}
        startInLoadingState
      />
      {allowFallback ? (
        <Pressable onPress={goFallback} style={{ marginTop: 6 }}>
          <Text style={[styles.retry, { color: colors.muted }]}>Pakai verifikasi lokal</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 14,
    minHeight: 78,
  },
  webview: {
    height: 78,
    backgroundColor: 'transparent',
    borderRadius: 12,
  },
  loading: {
    position: 'absolute',
    zIndex: 1,
    left: 0,
    right: 0,
    top: 0,
    height: 78,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  hint: { fontSize: 12, fontWeight: '600' },
  fallbackBox: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  fallbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fallbackTitle: { fontWeight: '800', fontSize: 14 },
  fallbackHint: { fontWeight: '600', fontSize: 11, marginTop: 2 },
  retry: { fontWeight: '800', fontSize: 12, textAlign: 'center' },
});
