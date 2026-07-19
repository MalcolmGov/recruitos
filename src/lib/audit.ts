import "server-only";

import { randomUUID } from "node:crypto";

import { db } from "@/db";
import { auditLogs } from "@/db/schema";

type AuditEntry = {
  organizationId: string;
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
};

/**
 * Append-only audit trail. Fire-and-forget from mutations; never let audit
 * failures break the user-facing operation.
 */
export async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      id: randomUUID(),
      organizationId: entry.organizationId,
      actorId: entry.actorId ?? null,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      metadata: entry.metadata ?? {},
      ipAddress: entry.ipAddress,
    });
  } catch (error) {
    console.error("[audit] failed to record entry", entry.action, error);
  }
}
