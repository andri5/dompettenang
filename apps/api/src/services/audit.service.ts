import { prisma } from '../utils/prisma.js';
import type { Prisma } from '@prisma/client';

type AuditLogPayload = {
  userId?: string | null;
  actorRole?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  summary: string;
  metadata?: Prisma.InputJsonValue | null;
};

function safeSummary(summary: string) {
  // Keep summaries short to avoid DB/UX issues.
  const trimmed = summary.trim();
  return trimmed.length > 500 ? trimmed.slice(0, 500) : trimmed;
}

export const auditService = {
  async log(payload: AuditLogPayload) {
    try {
      await prisma.auditLog.create({
        data: {
          userId: payload.userId ?? null,
          actorRole: payload.actorRole ?? null,
          action: payload.action,
          entityType: payload.entityType,
          entityId: payload.entityId ?? null,
          summary: safeSummary(payload.summary),
          metadata: payload.metadata ?? undefined,
        },
      });
    } catch (e) {
      // Never block the main action if audit logging fails.
      console.error('AuditLog failed:', e);
    }
  },
};
