"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { creditLedger } from "@/db/schema";
import { PLANS, type PlanId } from "@/lib/plans";
import { recordAudit } from "@/lib/audit";
import { requirePermission, requireTenant } from "@/lib/session";
import { applyPlanChange } from "@/server/billing";

type ChangePlanResult =
  | { ok: true; mode: "applied" }
  | { ok: true; mode: "checkout"; url: string }
  | { ok: false; error: string };

const planSchema = z.enum(["starter", "professional", "enterprise"]);

/**
 * Plan changes go through the payment seam:
 *  - STRIPE_SECRET_KEY present → Stripe Checkout (webhook applies the plan)
 *  - otherwise → dev mode: apply instantly (local development / demos)
 */
export async function changePlan(input: unknown): Promise<ChangePlanResult> {
  const { session, organizationId } = await requireTenant();
  await requirePermission({ billing: ["manage"] });

  const parsed = planSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Unknown plan." };
  const nextPlan: PlanId = parsed.data;

  if (process.env.STRIPE_SECRET_KEY && nextPlan !== "starter") {
    const { createCheckoutForPlan } = await import("./stripe");
    try {
      const url = await createCheckoutForPlan(organizationId, nextPlan);
      return { ok: true, mode: "checkout", url };
    } catch (error) {
      console.error("[billing] stripe checkout failed", error);
      return { ok: false, error: "Could not start checkout — please try again." };
    }
  }

  await applyPlanChange(organizationId, nextPlan);
  await recordAudit({
    organizationId,
    actorId: session.user.id,
    action: "billing.plan_changed",
    entityType: "tenant",
    metadata: { plan: nextPlan, mode: "dev" },
  });
  revalidatePath("/billing");
  return { ok: true, mode: "applied" };
}

/** Dev-mode top-up; the Stripe path gets a real product in the live setup. */
export async function topUpCredits(): Promise<{ ok: boolean; error?: string }> {
  const { session, organizationId } = await requireTenant();
  await requirePermission({ billing: ["manage"] });

  if (process.env.STRIPE_SECRET_KEY) {
    return { ok: false, error: "Top-ups go through Stripe checkout in live mode — not wired yet." };
  }

  await db.insert(creditLedger).values({
    id: randomUUID(),
    organizationId,
    delta: 100,
    reason: "topup",
    meta: { mode: "dev" },
  });
  await recordAudit({
    organizationId,
    actorId: session.user.id,
    action: "billing.topup",
    entityType: "tenant",
    metadata: { credits: 100, mode: "dev" },
  });
  revalidatePath("/billing");
  return { ok: true };
}

export async function getPlanCatalog() {
  return Object.values(PLANS);
}
