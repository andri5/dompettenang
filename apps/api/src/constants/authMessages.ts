/**
 * Safe auth-facing messages (OWASP: avoid account enumeration / info disclosure).
 * Internal logs may keep detail; clients only see these strings.
 */

export const AUTH_SAFE = {
  loginFailed: 'Email atau password salah',
  registerFailed:
    'Tidak dapat membuat akun. Coba email lain atau masuk jika sudah punya akun.',
  forgotPassword:
    'Jika email terdaftar, tautan reset password akan dikirim. Periksa kotak masuk atau folder spam.',
  resetInvalid: 'Tautan reset tidak valid atau sudah kedaluwarsa. Ajukan ulang lupa password.',
  changePasswordFailed: 'Tidak dapat mengubah password. Periksa input lalu coba lagi.',
  sessionInvalid: 'Sesi tidak valid. Silakan masuk lagi.',
  loginUnavailable: 'Login sementara tidak tersedia. Coba lagi sebentar.',
  genericAuth: 'Permintaan tidak dapat diproses. Silakan coba lagi.',
} as const;

/** Valid bcrypt hash used only to equalize login timing when user is missing. */
export const LOGIN_DUMMY_HASH =
  '$2a$12$F6bvZxCqjR4gHI9tVJ7fTOg8wkacYWCB6GnyuEn2eF/BFX94O3BI6';
