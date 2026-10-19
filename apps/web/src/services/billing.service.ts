/**
 * Dompet Tenang - Manual Pro Lifetime billing
 */

import api from '@/lib/api';
import type { ApiResponse } from '@/types';

export interface BillingPlans {
  lifetime: {
    id: string;
    name: string;
    price: number;
    currency: string;
    description: string;
  };
  bank: {
    name: string | null;
    account: string | null;
    holder: string | null;
    configured: boolean;
  };
}

export type ProPurchaseStatus =
  | 'PENDING'
  | 'PROOF_SUBMITTED'
  | 'APPROVED'
  | 'REJECTED';

export interface ProPurchaseRequest {
  id: string;
  userId: string;
  amount: number;
  transferNote: string;
  status: ProPurchaseStatus;
  proofPath: string | null;
  adminNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminProPurchaseRequest extends ProPurchaseRequest {
  user: { id: string; name: string; email: string };
}

export async function fetchBillingPlans(): Promise<BillingPlans> {
  const res = await api.get<ApiResponse<BillingPlans>>('/billing/plans');
  return res.data.data;
}

export async function createPurchaseRequest(): Promise<
  ProPurchaseRequest & BillingPlans
> {
  const res = await api.post<ApiResponse<ProPurchaseRequest & BillingPlans>>(
    '/billing/purchase-request'
  );
  return res.data.data;
}

export async function fetchMyPurchaseRequests(): Promise<ProPurchaseRequest[]> {
  const res = await api.get<ApiResponse<ProPurchaseRequest[]>>(
    '/billing/my-requests'
  );
  return res.data.data;
}

export async function uploadPurchaseProof(
  requestId: string,
  file: File
): Promise<ProPurchaseRequest> {
  const formData = new FormData();
  formData.append('proof', file);
  const res = await api.post<ApiResponse<ProPurchaseRequest>>(
    `/billing/purchase-request/${requestId}/proof`,
    formData,
    { timeout: 60000 }
  );
  return res.data.data;
}

export async function fetchAdminProRequests(
  status?: string
): Promise<AdminProPurchaseRequest[]> {
  const res = await api.get<ApiResponse<AdminProPurchaseRequest[]>>(
    '/admin/pro-requests',
    { params: status ? { status } : undefined }
  );
  return res.data.data;
}

export async function approveProRequest(
  id: string,
  adminNote?: string
): Promise<ProPurchaseRequest> {
  const res = await api.post<ApiResponse<ProPurchaseRequest>>(
    `/admin/pro-requests/${id}/approve`,
    adminNote ? { adminNote } : {}
  );
  return res.data.data;
}

export async function rejectProRequest(
  id: string,
  adminNote: string
): Promise<ProPurchaseRequest> {
  const res = await api.post<ApiResponse<ProPurchaseRequest>>(
    `/admin/pro-requests/${id}/reject`,
    { adminNote }
  );
  return res.data.data;
}

export interface BillingSettings {
  lifetimePrice: number;
  bankName: string;
  bankAccount: string;
  bankHolder: string;
  configured: boolean;
}

export interface ProRequestsSummary {
  pending: number;
  proofSubmitted: number;
  open: number;
}

export async function fetchBillingSettings(): Promise<BillingSettings> {
  const res = await api.get<ApiResponse<BillingSettings>>('/admin/billing-settings');
  return res.data.data;
}

export async function saveBillingSettings(payload: {
  lifetimePrice?: number;
  bankName?: string;
  bankAccount?: string;
  bankHolder?: string;
}): Promise<BillingSettings> {
  const res = await api.put<ApiResponse<BillingSettings>>(
    '/admin/billing-settings',
    payload
  );
  return res.data.data;
}

export async function fetchProRequestsSummary(): Promise<ProRequestsSummary> {
  const res = await api.get<ApiResponse<ProRequestsSummary>>(
    '/admin/pro-requests/summary'
  );
  return res.data.data;
}
