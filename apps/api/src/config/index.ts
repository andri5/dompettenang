import dotenv from 'dotenv';

dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

const DEFAULT_JWT = 'default-secret';
const DEFAULT_JWT_REFRESH = 'default-refresh-secret';

const jwtSecret = process.env.JWT_SECRET || DEFAULT_JWT;
const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || DEFAULT_JWT_REFRESH;

const smtpHost = process.env.SMTP_HOST || '';
const smtpUser = process.env.SMTP_USER || '';
const smtpPass = process.env.SMTP_PASS || '';
const smtpEnabled =
  process.env.SMTP_ENABLED === 'true' ||
  (!!smtpHost && !!smtpUser && !!smtpPass);

if (isProduction) {
  const missing: string[] = [];
  if (!process.env.JWT_SECRET || jwtSecret === DEFAULT_JWT) {
    missing.push('JWT_SECRET');
  }
  if (!process.env.JWT_REFRESH_SECRET || jwtRefreshSecret === DEFAULT_JWT_REFRESH) {
    missing.push('JWT_REFRESH_SECRET');
  }
  if (!process.env.DATABASE_URL) {
    missing.push('DATABASE_URL');
  }
  if (missing.length) {
    console.error(
      `[fatal] Production start blocked. Set strong values for: ${missing.join(', ')}`
    );
    process.exit(1);
  }
  if (!smtpEnabled) {
    console.warn(
      '[warn] SMTP not configured — forgot-password will not send email in production.'
    );
  }
} else if (jwtSecret === DEFAULT_JWT || jwtRefreshSecret === DEFAULT_JWT_REFRESH) {
  console.warn(
    '[warn] Using default JWT secrets. Set JWT_SECRET and JWT_REFRESH_SECRET before production.'
  );
}

export const config = {
  nodeEnv,
  isProduction,
  port: parseInt(process.env.PORT || '3001', 10),

  databaseUrl: process.env.DATABASE_URL || '',

  jwt: {
    secret: jwtSecret,
    refreshSecret: jwtRefreshSecret,
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  upload: {
    dir: process.env.UPLOAD_DIR || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10),
  },

  // Comma-separated origins supported, e.g. https://a.id,https://www.a.id
  corsOrigin: (() => {
    const raw = process.env.CORS_ORIGIN || 'http://localhost:5173';
    const list = raw.split(',').map((s) => s.trim()).filter(Boolean);
    return list.length <= 1 ? list[0] || 'http://localhost:5173' : list;
  })(),
  appUrl: process.env.APP_URL || process.env.CORS_ORIGIN?.split(',')[0]?.trim() || 'http://localhost:5173',

  /**
   * Cookie auth (web). Mobile continues to use Authorization Bearer.
   */
  cookie: {
    accessName: 'dd_access',
    refreshName: 'dd_refresh',
    secure: isProduction || process.env.COOKIE_SECURE === 'true',
    sameSite: (process.env.COOKIE_SAME_SITE as 'lax' | 'strict' | 'none') || 'lax',
    /** Access cookie max-age seconds (align with JWT access when possible) */
    accessMaxAgeSec: parseInt(process.env.COOKIE_ACCESS_MAX_AGE || '900', 10),
    refreshMaxAgeSec: parseInt(process.env.COOKIE_REFRESH_MAX_AGE || String(7 * 24 * 3600), 10),
  },

  smtp: {
    enabled: smtpEnabled,
    host: smtpHost,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: smtpUser,
    pass: smtpPass,
    from: process.env.SMTP_FROM || smtpUser || 'noreply@dompettenang.local',
  },

  /**
   * Dev-only: return resetUrl in forgot-password JSON when SMTP is off.
   * Never in production.
   */
  exposePasswordResetUrl:
    !isProduction &&
    (process.env.EXPOSE_PASSWORD_RESET_URL === 'true' ||
      (!smtpEnabled && process.env.EXPOSE_PASSWORD_RESET_URL !== 'false')),

  /**
   * Cloudflare Turnstile (captcha). Site key is public; secret stays server-side.
   * Local test keys: https://developers.cloudflare.com/turnstile/troubleshooting/testing/
   */
  turnstile: {
    siteKey: process.env.TURNSTILE_SITE_KEY || '',
    secretKey: process.env.TURNSTILE_SECRET_KEY || '',
  },

  /** Manual Pro Lifetime purchase (transfer bank) */
  billing: {
    lifetimePrice: parseInt(process.env.PRO_LIFETIME_PRICE || '29000', 10),
    bankName: process.env.PRO_BANK_NAME || '',
    bankAccount: process.env.PRO_BANK_ACCOUNT || '',
    bankHolder: process.env.PRO_BANK_HOLDER || '',
  },
} as const;

export type Config = typeof config;
