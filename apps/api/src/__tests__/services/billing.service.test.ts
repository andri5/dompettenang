import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { ProPurchaseStatus } from '@prisma/client';

vi.mock('../../utils/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    proPurchaseRequest: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
  },
}));

vi.mock('../../config/index', () => ({
  config: {
    appUrl: 'https://dompet-tenang.web.id/',
    billing: { lifetimePrice: 29000, bankName: '', bankAccount: '', bankHolder: '' },
  },
}));

vi.mock('../../services/email.service', () => ({
  isSmtpConfigured: vi.fn(() => true),
  sendProProofSubmittedEmail: vi.fn(),
  sendProApprovedEmail: vi.fn(),
  sendProRejectedEmail: vi.fn(),
}));

import { prisma } from '../../utils/prisma.js';
import {
  isSmtpConfigured,
  sendProApprovedEmail,
  sendProProofSubmittedEmail,
  sendProRejectedEmail,
} from '../../services/email.service.js';
import { approveRequest, rejectRequest, submitProof } from '../../services/billing.service.js';

const requestRow = {
  id: 'req-1',
  userId: 'user-1',
  amount: 29000,
  transferNote: 'DT-ABC123-F00D',
  status: 'PENDING' as ProPurchaseStatus,
  proofPath: null,
  adminNote: null,
  reviewedAt: null,
  createdAt: new Date('2026-11-02T00:00:00Z'),
  updatedAt: new Date('2026-11-02T00:00:00Z'),
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(isSmtpConfigured).mockReturnValue(true);
});

describe('billing payment emails', () => {
  it('emails every admin when a proof is submitted', async () => {
    vi.mocked(prisma.proPurchaseRequest.findFirst).mockResolvedValue(requestRow);
    vi.mocked(prisma.proPurchaseRequest.update).mockResolvedValue({
      ...requestRow,
      status: 'PROOF_SUBMITTED',
      proofPath: '/uploads/proofs/user-1-proof.jpg',
    });
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      name: 'Sari',
      email: 'sari@example.com',
    } as never);
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      { email: 'admin@example.com' },
      { email: 'ops@example.com' },
    ] as never);

    const result = await submitProof('user-1', 'req-1', '/uploads/proofs/user-1-proof.jpg');

    expect(result.status).toBe('PROOF_SUBMITTED');
    expect(sendProProofSubmittedEmail).toHaveBeenCalledWith({
      to: ['admin@example.com', 'ops@example.com'],
      buyerName: 'Sari',
      buyerEmail: 'sari@example.com',
      amount: 29000,
      transferNote: 'DT-ABC123-F00D',
      reviewUrl: 'https://dompet-tenang.web.id/admin/pro',
    });
  });

  it('keeps the proof saved when the admin email fails', async () => {
    vi.mocked(prisma.proPurchaseRequest.findFirst).mockResolvedValue(requestRow);
    vi.mocked(prisma.proPurchaseRequest.update).mockResolvedValue({
      ...requestRow,
      status: 'PROOF_SUBMITTED',
      proofPath: '/uploads/proofs/user-1-proof.jpg',
    });
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      name: 'Sari',
      email: 'sari@example.com',
    } as never);
    vi.mocked(prisma.user.findMany).mockResolvedValue([{ email: 'admin@example.com' }] as never);
    vi.mocked(sendProProofSubmittedEmail).mockRejectedValue(new Error('smtp down'));

    const result = await submitProof('user-1', 'req-1', '/uploads/proofs/user-1-proof.jpg');

    expect(result.status).toBe('PROOF_SUBMITTED');
  });

  it('emails the buyer when Pro is approved and skips a second approval', async () => {
    vi.mocked(prisma.proPurchaseRequest.findUnique).mockResolvedValue(requestRow);
    vi.mocked(prisma.user.update).mockResolvedValue({} as never);
    vi.mocked(prisma.proPurchaseRequest.update).mockResolvedValue({
      ...requestRow,
      status: 'APPROVED',
    });
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      name: 'Sari',
      email: 'sari@example.com',
    } as never);

    const result = await approveRequest('req-1');

    expect(result.status).toBe('APPROVED');
    expect(sendProApprovedEmail).toHaveBeenCalledWith({
      to: 'sari@example.com',
      name: 'Sari',
      amount: 29000,
      transferNote: 'DT-ABC123-F00D',
      appUrl: 'https://dompet-tenang.web.id',
    });

    vi.mocked(prisma.proPurchaseRequest.findUnique).mockResolvedValue({
      ...requestRow,
      status: 'APPROVED',
    });
    await approveRequest('req-1');
    expect(sendProApprovedEmail).toHaveBeenCalledTimes(1);
  });

  it('emails the rejection reason to the buyer', async () => {
    vi.mocked(prisma.proPurchaseRequest.findUnique).mockResolvedValue({
      ...requestRow,
      status: 'PROOF_SUBMITTED',
    });
    vi.mocked(prisma.proPurchaseRequest.update).mockResolvedValue({
      ...requestRow,
      status: 'REJECTED',
      adminNote: 'Nominal atau rekening transfer salah',
    });
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      name: 'Sari',
      email: 'sari@example.com',
    } as never);

    const result = await rejectRequest('req-1', 'Nominal atau rekening transfer salah');

    expect(result.status).toBe('REJECTED');
    expect(sendProRejectedEmail).toHaveBeenCalledWith({
      to: 'sari@example.com',
      name: 'Sari',
      amount: 29000,
      transferNote: 'DT-ABC123-F00D',
      adminNote: 'Nominal atau rekening transfer salah',
      appUrl: 'https://dompet-tenang.web.id/upgrade',
    });
  });

  it('does not send when SMTP is off', async () => {
    vi.mocked(isSmtpConfigured).mockReturnValue(false);
    vi.mocked(prisma.proPurchaseRequest.findFirst).mockResolvedValue(requestRow);
    vi.mocked(prisma.proPurchaseRequest.update).mockResolvedValue({
      ...requestRow,
      status: 'PROOF_SUBMITTED',
      proofPath: '/uploads/proofs/a.jpg',
    });

    await submitProof('user-1', 'req-1', '/uploads/proofs/a.jpg');

    expect(sendProProofSubmittedEmail).not.toHaveBeenCalled();
    expect(prisma.user.findMany).not.toHaveBeenCalled();
  });
});
