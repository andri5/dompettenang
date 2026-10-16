/**
 * Upload helpers + authenticated media URLs
 */

import { Platform } from 'react-native';
import { api, API_BASE_URL, getAccessToken } from './api';
import type { User } from './auth';

export type UploadReceiptResult = {
  url: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
};

/** `/uploads/receipts/x.jpg` → absolute content URL for authenticated GET */
export function toContentUrl(publicPath: string | null | undefined): string | null {
  if (!publicPath) return null;
  if (publicPath.startsWith('http://') || publicPath.startsWith('https://')) {
    try {
      const parsed = new URL(publicPath);
      const match = parsed.pathname.match(/^\/uploads\/(receipts|avatars)\/([^/?#]+)$/);
      if (match) {
        return `${API_BASE_URL}/uploads/content/${match[1]}/${match[2]}`;
      }
    } catch {
      // fall through
    }
    return publicPath;
  }
  const match = publicPath.match(/^\/uploads\/(receipts|avatars)\/([^/?#]+)$/);
  if (!match) return null;
  return `${API_BASE_URL}/uploads/content/${match[1]}/${match[2]}`;
}

export async function authImageSource(publicPath: string | null | undefined) {
  const uri = toContentUrl(publicPath);
  if (!uri) return null;
  const token = await getAccessToken();
  return {
    uri,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  };
}

export async function uploadReceipt(localUri: string, mimeType?: string, name?: string) {
  const form = new FormData();
  const filename = name || localUri.split('/').pop() || `receipt-${Date.now()}.jpg`;
  form.append('receipt', {
    uri: Platform.OS === 'ios' ? localUri.replace('file://', '') : localUri,
    type: mimeType || 'image/jpeg',
    name: filename,
  } as unknown as Blob);

  const { data } = await api.post('/uploads/receipt', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  });
  return data.data as UploadReceiptResult;
}

export async function uploadAvatar(localUri: string, mimeType?: string, name?: string) {
  const form = new FormData();
  const filename = name || localUri.split('/').pop() || `avatar-${Date.now()}.jpg`;
  form.append('avatar', {
    uri: Platform.OS === 'ios' ? localUri.replace('file://', '') : localUri,
    type: mimeType || 'image/jpeg',
    name: filename,
  } as unknown as Blob);

  const { data } = await api.post('/uploads/avatar', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  });
  return data.data as { url: string; user: User };
}
