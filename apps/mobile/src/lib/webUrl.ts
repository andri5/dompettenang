/**
 * Public website URLs (upgrade / billing happens on web).
 */

const fromEnv = process.env.EXPO_PUBLIC_WEB_URL?.replace(/\/$/, '');

export const WEB_BASE_URL = fromEnv || 'https://dompet-tenang.web.id';

export const WEB_UPGRADE_URL = `${WEB_BASE_URL}/upgrade`;
