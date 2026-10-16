/**
 * Cloudflare Turnstile server-side verification
 */

import { config } from '../config/index.js';
import { isFeatureEnabled } from './featureFlags.service.js';

type TurnstileApiResponse = {
  success: boolean;
  'error-codes'?: string[];
};

export async function getCaptchaPublicConfig() {
  const flagOn = await isFeatureEnabled('captcha_auth');
  const siteKey = config.turnstile.siteKey;
  const enabled = flagOn && Boolean(siteKey);

  return {
    enabled,
    provider: 'turnstile' as const,
    siteKey: enabled ? siteKey : null,
    /** Flag on but missing keys — admin should set TURNSTILE_* env */
    misconfigured: flagOn && !siteKey,
  };
}

/**
 * Enforce captcha when feature flag is on.
 * Dev without secret: skip with warning (local still usable).
 * Prod without secret: reject.
 */
export async function assertCaptchaIfRequired(
  captchaToken: string | undefined,
  remoteIp?: string
): Promise<void> {
  const flagOn = await isFeatureEnabled('captcha_auth');
  if (!flagOn) return;

  const secret = config.turnstile.secretKey;
  if (!secret) {
    if (config.isProduction) {
      throw new Error('CAPTCHA_MISCONFIGURED');
    }
    console.warn(
      '[turnstile] captcha_auth ON but TURNSTILE_SECRET_KEY missing — skipped in development'
    );
    return;
  }

  if (!captchaToken?.trim()) {
    throw new Error('CAPTCHA_REQUIRED');
  }

  const ok = await verifyTurnstileToken(captchaToken.trim(), remoteIp);
  if (!ok) {
    throw new Error('CAPTCHA_FAILED');
  }
}

export async function verifyTurnstileToken(
  token: string,
  remoteIp?: string
): Promise<boolean> {
  const secret = config.turnstile.secretKey;
  if (!secret) return false;

  const body = new URLSearchParams();
  body.set('secret', secret);
  body.set('response', token);
  if (remoteIp) body.set('remoteip', remoteIp);

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const data = (await res.json()) as TurnstileApiResponse;
    if (!data.success && data['error-codes']?.length) {
      console.warn('[turnstile] verify failed:', data['error-codes'].join(', '));
    }
    return Boolean(data.success);
  } catch (err) {
    console.error('[turnstile] verify request error', err);
    return false;
  }
}
