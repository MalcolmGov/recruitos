import "server-only";

import { count, desc, eq, gte, sql, sum } from "drizzle-orm";

import { db } from "@/db";
import {
  aiUsage,
  candidates,
  creditLedger,
  inquiries,
  jobs,
  member,
  organization,
  placements,
  tenantSettings,
  user,
} from "@/db/schema";
import { PLANS, type PlanId } from "@/lib/plans";

/**
 * Platform-console queries — the ONLY module allowed to read across tenants.
 * Everything here is gated behind requirePlatformAdmin() at the layout.
 */

const PLAN_PRICE_GBP: Record<PlanId, number> = {
  starter: 0,
  professional: 49,
  enterprise: 0, // custom-priced; excluded from the estimate
};

export type TenantRow = {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  plan: PlanId;
  members: number;
  candidates: number;
  jobs: number;
  placements: number;
  creditBalance: number;
};

export async function getPlatformOverview() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000);

  const [tenantCount, userCount, planRows, tokenRows, placementCount, inquiryCount, recentTenants] =
    await Promise.all([
      db.select({ value: count() }).from(organization),
      db.select({ value: count() }).from(user),
      db
        .select({ plan: tenantSettings.plan, value: count() })
        .from(tenantSettings)
        .groupBy(tenantSettings.plan),
      db
        .select({
          inputTokens: sum(aiUsage.inputTokens),
          outputTokens: sum(aiUsage.outputTokens),
          calls: count(),
        })
        .from(aiUsage)
        .where(gte(aiUsage.createdAt, thirtyDaysAgo)),
      db.select({ value: count() }).from(placements),
      db.select({ value: count() }).from(inquiries),
      db.query.organization.findMany({
        orderBy: [desc(organization.createdAt)],
        limit: 5,
        columns: { id: true, name: true, createdAt: true },
      }),
    ]);

  const planMix = new Map(planRows.map((row) => [row.plan, row.value]));
  // Orgs without a tenant_settings row are starters by default.
  const settingsTotal = planRows.reduce((total, row) => total + row.value, 0);
  const starterExtra = (tenantCount[0]?.value ?? 0) - settingsTotal;

  const professionalSeats = await db
    .select({ value: count() })
    .from(member)
    .innerJoin(tenantSettings, eq(member.organizationId, tenantSettings.organizationId))
    .where(eq(tenantSettings.plan, "professional"));

  return {
    tenants: tenantCount[0]?.value ?? 0,
    users: userCount[0]?.value ?? 0,
    planMix: {
      starter: (planMix.get("starter") ?? 0) + Math.max(starterExtra, 0),
      professional: planMix.get("professional") ?? 0,
      enterprise: planMix.get("enterprise") ?? 0,
    },
    estimatedMrrGbp: (professionalSeats[0]?.value ?? 0) * PLAN_PRICE_GBP.professional,
    ai30d: {
      inputTokens: Number(tokenRows[0]?.inputTokens ?? 0),
      outputTokens: Number(tokenRows[0]?.outputTokens ?? 0),
      calls: tokenRows[0]?.calls ?? 0,
    },
    placements: placementCount[0]?.value ?? 0,
    inquiries: inquiryCount[0]?.value ?? 0,
    recentTenants,
  };
}

export async function getTenants(): Promise<TenantRow[]> {
  const [orgs, settings, memberCounts, candidateCounts, jobCounts, placementCounts, balances] =
    await Promise.all([
      db.query.organization.findMany({ orderBy: [desc(organization.createdAt)] }),
      db.query.tenantSettings.findMany(),
      db
        .select({ organizationId: member.organizationId, value: count() })
        .from(member)
        .groupBy(member.organizationId),
      db
        .select({ organizationId: candidates.organizationId, value: count() })
        .from(candidates)
        .groupBy(candidates.organizationId),
      db
        .select({ organizationId: jobs.organizationId, value: count() })
        .from(jobs)
        .groupBy(jobs.organizationId),
      db
        .select({ organizationId: placements.organizationId, value: count() })
        .from(placements)
        .groupBy(placements.organizationId),
      db
        .select({ organizationId: creditLedger.organizationId, value: sum(creditLedger.delta) })
        .from(creditLedger)
        .groupBy(creditLedger.organizationId),
    ]);

  const lookup = <T extends { organizationId: string }>(rows: T[]) =>
    new Map(rows.map((row) => [row.organizationId, row]));
  const settingsMap = new Map(settings.map((row) => [row.organizationId, row]));
  const membersMap = lookup(memberCounts);
  const candidatesMap = lookup(candidateCounts);
  const jobsMap = lookup(jobCounts);
  const placementsMap = lookup(placementCounts);
  const balancesMap = lookup(balances);

  return orgs.map((org) => ({
    id: org.id,
    name: org.name,
    slug: org.slug ?? "",
    createdAt: org.createdAt,
    plan: settingsMap.get(org.id)?.plan ?? "starter",
    members: membersMap.get(org.id)?.value ?? 0,
    candidates: candidatesMap.get(org.id)?.value ?? 0,
    jobs: jobsMap.get(org.id)?.value ?? 0,
    placements: placementsMap.get(org.id)?.value ?? 0,
    creditBalance: Number(balancesMap.get(org.id)?.value ?? 0),
  }));
}

export async function getAiUsageByTenant() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000);
  const rows = await db
    .select({
      organizationId: aiUsage.organizationId,
      tenant: organization.name,
      feature: aiUsage.feature,
      calls: count(),
      inputTokens: sum(aiUsage.inputTokens),
      outputTokens: sum(aiUsage.outputTokens),
    })
    .from(aiUsage)
    .innerJoin(organization, eq(aiUsage.organizationId, organization.id))
    .where(gte(aiUsage.createdAt, thirtyDaysAgo))
    .groupBy(aiUsage.organizationId, organization.name, aiUsage.feature)
    .orderBy(sql`sum(${aiUsage.outputTokens}) desc`);

  return rows.map((row) => ({
    ...row,
    inputTokens: Number(row.inputTokens ?? 0),
    outputTokens: Number(row.outputTokens ?? 0),
  }));
}

export async function getRecentInquiries() {
  return db.query.inquiries.findMany({
    orderBy: [desc(inquiries.createdAt)],
    limit: 50,
  });
}

export { PLANS };
