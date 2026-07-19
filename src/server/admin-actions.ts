"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { creditLedger } from "@/db/schema";
import { recordAudit } from "@/lib/audit";
import { requirePlatformAdmin } from "@/lib/platform-admin";
import { applyPlanChange } from "@/server/billing";

type ActionResult = { ok: true } | { ok: false; error: string };

const planChangeSchema = z.object({
  organizationId: z.string().min(10),
  plan: z.enum(["starter", "professional", "enterprise"]),
});

/** Operator override — e.g. activating Enterprise after an offline contract. */
export async function adminChangePlan(input: unknown): Promise<ActionResult> {
  const session = await requirePlatformAdmin();
  const parsed = planChangeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };

  await applyPlanChange(parsed.data.organizationId, parsed.data.plan);
  await recordAudit({
    organizationId: parsed.data.organizationId,
    actorId: session.user.id,
    action: "billing.plan_changed",
    entityType: "tenant",
    metadata: { plan: parsed.data.plan, mode: "platform-admin" },
  });
  revalidatePath("/admin/tenants");
  return { ok: true };
}

const grantSchema = z.object({
  organizationId: z.string().min(10),
  credits: z.coerce.number().int().min(1).max(10_000),
});

/** Goodwill / support credit grants, always visible in the tenant's ledger. */
export async function adminGrantCredits(input: unknown): Promise<ActionResult> {
  const session = await requirePlatformAdmin();
  const parsed = grantSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };

  await db.insert(creditLedger).values({
    id: randomUUID(),
    organizationId: parsed.data.organizationId,
    delta: parsed.data.credits,
    reason: "adjustment",
    meta: { grantedBy: "platform-admin" },
  });
  await recordAudit({
    organizationId: parsed.data.organizationId,
    actorId: session.user.id,
    action: "billing.topup",
    entityType: "tenant",
    metadata: { credits: parsed.data.credits, mode: "platform-admin" },
  });
  revalidatePath("/admin/tenants");
  return { ok: true };
}
