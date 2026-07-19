import "server-only";

import { randomUUID } from "node:crypto";

import { and, desc, eq, sql, sum } from "drizzle-orm";

import { db } from "@/db";
import { creditLedger, tenantSettings } from "@/db/schema";
import { AI_CREDIT_COSTS, PLANS, type AiFeature, type PlanId } from "@/lib/plans";

/**
 * AI-credit engine. Balance is the sum of an append-only ledger; the current
 * month's allowance is granted lazily on first read (idempotent via the
 * partial unique index on org+period).
 */

function currentPeriod(): string {
  return new Date().toISOString().slice(0, 7); // YYYY-MM
}

export async function getTenantPlan(organizationId: string): Promise<PlanId> {
  const settings = await db.query.tenantSettings.findFirst({
    where: eq(tenantSettings.organizationId, organizationId),
    columns: { plan: true },
  });
  return settings?.plan ?? "starter";
}

async function ensureMonthlyGrant(organizationId: string): Promise<void> {
  const period = currentPeriod();
  const plan = PLANS[await getTenantPlan(organizationId)];
  await db
    .insert(creditLedger)
    .values({
      id: randomUUID(),
      organizationId,
      delta: plan.monthlyAiCredits,
      reason: "monthly_grant",
      period,
      meta: { plan: plan.id },
    })
    .onConflictDoNothing();
}

export async function getCreditBalance(organizationId: string): Promise<number> {
  await ensureMonthlyGrant(organizationId);
  const [row] = await db
    .select({ balance: sum(creditLedger.delta) })
    .from(creditLedger)
    .where(eq(creditLedger.organizationId, organizationId));
  return Number(row?.balance ?? 0);
}

export type ChargeResult = { ok: true; remaining: number } | { ok: false; error: string };

/**
 * Reserve credits for an AI action. Call before the model call; if the model
 * call fails the caller should refund via refundAiCredits.
 */
export async function chargeAiCredits(
  organizationId: string,
  feature: AiFeature,
): Promise<ChargeResult> {
  const cost = AI_CREDIT_COSTS[feature];
  const balance = await getCreditBalance(organizationId);
  if (balance < cost) {
    return {
      ok: false,
      error: `Not enough AI credits (${balance} left, ${cost} needed). Upgrade your plan or top up in Billing.`,
    };
  }
  await db.insert(creditLedger).values({
    id: randomUUID(),
    organizationId,
    delta: -cost,
    reason: "consumption",
    meta: { feature },
  });
  return { ok: true, remaining: balance - cost };
}

export async function refundAiCredits(
  organizationId: string,
  feature: AiFeature,
): Promise<void> {
  await db.insert(creditLedger).values({
    id: randomUUID(),
    organizationId,
    delta: AI_CREDIT_COSTS[feature],
    reason: "adjustment",
    meta: { feature, refund: true },
  });
}

/**
 * Apply a plan change. On upgrade, grant the positive allowance difference
 * immediately so the tenant isn't stuck until next month.
 */
export async function applyPlanChange(
  organizationId: string,
  nextPlan: PlanId,
): Promise<void> {
  const previous = await getTenantPlan(organizationId);
  if (previous === nextPlan) return;

  await db
    .insert(tenantSettings)
    .values({ organizationId, plan: nextPlan })
    .onConflictDoUpdate({
      target: tenantSettings.organizationId,
      set: { plan: nextPlan },
    });

  const difference = PLANS[nextPlan].monthlyAiCredits - PLANS[previous].monthlyAiCredits;
  if (difference > 0) {
    await db.insert(creditLedger).values({
      id: randomUUID(),
      organizationId,
      delta: difference,
      reason: "plan_change",
      meta: { from: previous, to: nextPlan },
    });
  }
}

export async function getBillingOverview(organizationId: string) {
  // Balance first: it lazily inserts the monthly grant, which the ledger
  // query below must be able to see.
  const balance = await getCreditBalance(organizationId);
  const [planId, ledger, monthUsage] = await Promise.all([
    getTenantPlan(organizationId),
    db.query.creditLedger.findMany({
      where: eq(creditLedger.organizationId, organizationId),
      orderBy: [desc(creditLedger.createdAt)],
      limit: 15,
    }),
    db
      .select({ spent: sum(creditLedger.delta) })
      .from(creditLedger)
      .where(
        and(
          eq(creditLedger.organizationId, organizationId),
          eq(creditLedger.reason, "consumption"),
          sql`${creditLedger.createdAt} >= date_trunc('month', now())`,
        ),
      ),
  ]);
  return {
    balance,
    planId,
    ledger,
    spentThisMonth: Math.abs(Number(monthUsage[0]?.spent ?? 0)),
  } as const;
}
