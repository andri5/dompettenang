/**
 * Client-side auth error mapping (OWASP: do not echo raw/internal API details).
 */

export const AUTH_SAFE = {
  loginFailed: 'Email atau password salah',
  registerFailed:
    'Tidak dapat membuat akun. Coba email lain atau masuk jika sudah punya akun.',
  forgotPassword:
    'Jika email terdaftar, tautan reset password akan dikirim. Periksa kotak masuk atau folder spam.',
  resetInvalid: 'Tautan reset tidak valid atau sudah kedaluwarsa. Ajukan ulang lupa password.',
  changePasswordFailed: 'Tidak dapat mengubah password. Periksa input lalu coba lagi.',
  network: 'Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.',
  captchaFailed: 'Verifikasi captcha gagal. Silakan coba lagi.',
  generic: 'Permintaan tidak dapat diproses. Silakan coba lagi.',
} as const;

type ApiErr = {
  response?: { status?: number; data?: { message?: string; code?: string } };
  message?: string;
  code?: string;
};

export function authErrorMessage(
  err: unknown,
  fallback: string = AUTH_SAFE.generic
): string {
  const e = err as ApiErr;
  if (!e?.response) return AUTH_SAFE.network;

  const status = e.response.status;
  const code = e.response.data?.code;
  const msg = e.response.data?.message?.trim();

  if (status === 401 || code === 'UNAUTHORIZED') {
    if (msg === AUTH_SAFE.loginFailed) return AUTH_SAFE.loginFailed;
    return AUTH_SAFE.loginFailed;
  }

  if (code === 'REGISTRATION_FAILED' || status === 409) {
    return AUTH_SAFE.registerFailed;
  }

  if (code === 'RESET_PASSWORD_FAILED') {
    return AUTH_SAFE.resetInvalid;
  }

  if (code === 'CHANGE_PASSWORD_FAILED') {
    return AUTH_SAFE.changePasswordFailed;
  }

  if (code === 'CAPTCHA_FAILED') {
    return msg || AUTH_SAFE.captchaFailed;
  }

  if (code === 'LOGIN_UNAVAILABLE' || status === 503) {
    return msg?.includes('Captcha')
      ? msg
      : 'Login sementara tidak tersedia. Coba lagi sebentar.';
  }

  const allowed = new Set<string>(Object.values(AUTH_SAFE));
  if (msg && allowed.has(msg)) return msg;

  return fallback;
}
