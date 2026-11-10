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

/** Upload + OCR scan (may be slow; prefer uploadReceipt then this only as optional). */
export async function uploadReceiptWithScan(file: File): Promise<UploadReceiptResult> {
  const formData = new FormData();
  formData.append('receipt', file);

  const response = await api.post<ApiResponse<UploadReceiptResult>>(
    '/uploads/receipt/scan',
    formData,
    { timeout: 90000 }
  );

  return response.data.data;
}

/**
 * Reliable mobile path: plain upload only (must succeed).
 * OCR is attempted afterward via tryReceiptOcr — never blocks/fails the upload.
 */
export async function uploadReceiptReliable(file: File): Promise<UploadReceiptResult> {
  return uploadReceipt(file);
}

/** Best-effort OCR after a successful upload. Never throws. */
export async function tryReceiptOcr(file: File): Promise<ReceiptOcrSuggestion | null> {
  try {
    const scanned = await uploadReceiptWithScan(file);
    return scanned.ocr ?? null;
  } catch {
    return {
      amount: null,
      date: null,
      description: null,
      confidence: null,
      supported: true,
      message: 'Struk tersimpan. Scan otomatis gagal — isi form manual.',
    };
  }
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
