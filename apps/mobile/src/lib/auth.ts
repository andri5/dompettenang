/**
 * Auth API helpers
 */

import { api, clearTokens, saveTokens } from './api';

export type Gender = 'MALE' | 'FEMALE';

export type User = {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  currency?: string;
  role?: 'USER' | 'ADMIN';
  gender?: Gender | null;
  birthDate?: string | null;
  createdAt?: string | Date | null;
};

export type AuthResult = {
  user: User;
  accessToken: string;
  refreshToken: string;
};

export async function login(email: string, password: string, captchaToken?: string): Promise<AuthResult> {
  const { data } = await api.post('/auth/login', {
    email,
    password,
    ...(captchaToken ? { captchaToken } : {}),
  });
  const result = data.data as AuthResult;
  await saveTokens(result.accessToken, result.refreshToken);
  return result;
}

export async function register(
  name: string,
  email: string,
  password: string,
  options?: {
    gender: Gender;
    birthDate: string;
    captchaToken?: string;
  }
): Promise<AuthResult> {
  const { data } = await api.post('/auth/register', {
    name,
    email,
    password,
    gender: options?.gender,
    birthDate: options?.birthDate,
    ...(options?.captchaToken ? { captchaToken: options.captchaToken } : {}),
  });
  const result = data.data as AuthResult;
  await saveTokens(result.accessToken, result.refreshToken);
  return result;
}

export async function getMe(): Promise<User> {
  const { data } = await api.get('/auth/me');
  return data.data as User;
}

export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout', {});
  } finally {
    await clearTokens();
  }
}

export async function forgotPassword(
  email: string,
  captchaToken?: string
): Promise<{ message: string; resetUrl?: string }> {
  const { data } = await api.post('/auth/forgot-password', {
    email,
    ...(captchaToken ? { captchaToken } : {}),
  });
  return {
    message: (data.message as string) || 'Jika email terdaftar, link reset akan dikirim.',
    resetUrl: (data.data as { resetUrl?: string } | undefined)?.resetUrl,
  };
}

export async function resetPassword(token: string, password: string): Promise<string> {
  const { data } = await api.post('/auth/reset-password', { token, password });
  return (data.message as string) || 'Password berhasil diubah.';
}

export async function updateProfile(input: {
  name?: string;
  currency?: string;
  gender?: Gender | null;
  birthDate?: string | null;
}): Promise<User> {
  const { data } = await api.put('/auth/profile', input);
  return data.data as User;
}

export async function changePassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<string> {
  const { data } = await api.post('/auth/change-password', input);
  return (data.message as string) || 'Password berhasil diubah.';
}
