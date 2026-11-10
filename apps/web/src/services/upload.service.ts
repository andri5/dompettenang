/**
 * Dompet Tenang - Upload Service
 */

import api from '@/lib/api';
import type { ApiResponse } from '@/types';

export interface ReceiptOcrSuggestion {
  amount: number | null;
  date: string | null;
  description: string | null;
  confidence: number | null;
  supported: boolean;
  message: string | null;
}

export interface UploadReceiptResult {
  url: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  ocr?: ReceiptOcrSuggestion;
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

/** Upload + OCR scan (first run may be slower while Tesseract loads). */
export async function uploadReceiptWithScan(file: File): Promise<UploadReceiptResult> {
  const formData = new FormData();
  formData.append('receipt', file);

  const response = await api.post<ApiResponse<UploadReceiptResult>>(
    '/uploads/receipt/scan',
    formData,
    { timeout: 120000 }
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
