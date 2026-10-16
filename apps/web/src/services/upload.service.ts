/**
 * Dompet Tenang - Upload Service
 */

import api from '@/lib/api';
import type { ApiResponse } from '@/types';

export interface UploadReceiptResult {
  url: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
}

export async function uploadReceipt(file: File): Promise<UploadReceiptResult> {
  const formData = new FormData();
  formData.append('receipt', file);

  const response = await api.post<ApiResponse<UploadReceiptResult>>(
    '/uploads/receipt',
    formData,
    { timeout: 60000 }
  );

  return response.data.data;
}

export async function uploadAvatar(file: File): Promise<{
  url: string;
  user: import('@/types').User;
}> {
  const formData = new FormData();
  formData.append('avatar', file);

  const response = await api.post<
    ApiResponse<{ url: string; user: import('@/types').User }>
  >('/uploads/avatar', formData, { timeout: 60000 });

  return response.data.data;
}
