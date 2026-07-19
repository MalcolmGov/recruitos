import "server-only";

import { and, count, desc, eq, gte, inArray, lt, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  applications,
  auditLogs,
  candidates,
  jobs,
  placements,
  type HiringStage,
} from "@/db/schema";
import { getCreditBalance, getTenantPlan } from "@/server/billing";
import { PLANS } from "@/lib/plans";

/**
 * Executive dashboard data. One module, one round of queries — the page stays
 * a thin presenter. Every number is tenant-scoped and answerable in the UI
 * within the "what's happening / what needs me / what's next" frame.
 */

export type Trend = { current: number; previous: number };

export type FunnelTier = {
  key: string;
  label: string;
  count: number;
  /** share of everyone currently in the pipeline, 0..1 */
  share: number;
};

export type Insight = {
  severity: "action" | "watch";
  title: string;
  detail: string;
  href: string;
  cta: string;
};

const INTERVIEW_STAGES: HiringStage[] = ["interview_1", "interview_2", "technical"];
const ACTIVE_STAGES: HiringStage[] = [
  "applied",
  "screening",
  "interview_1",
  "interview_2",
  "technical",
  "references",
  "offer",
];

function monthStart(offsetMonths = 0): Date {
  const date = new Date();
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  date.setMonth(date.getMonth() + offsetMonths);
  return date;
}

export async function getDashboardData(organizationId: string) {
  const thisMonth = monthStart();
  const lastMonth = monthStart(-1);
  const eightWeeksAgo = new Date(Date.now() - 8 * 7 * 24 * 3600 * 1000);

  const countWhere = async (table: typeof placements | typeof candidates, extra: ReturnType<typeof and>) => {
    const [row] = await db.select({ value: count() }).from(table).where(extra);
    return row?.value ?? 0;
  };

  const [
    openJobs,
    activeCandidates,
    placementsNow,
    placementsPrev,
    candidatesNow,
    candidatesPrev,
    interviewsActive,
    pipelineActive,
    stageRows,
    weeklyApplications,
    activity,
    balance,
    planId,
    jobsNeedingCandidates,
    staleApplications,
    offersOpen,
    draftJobs,
  ] = await Promise.all([
    countWhere(jobs as never, and(eq(jobs.organizationId, organizationId), eq(jobs.status, "open"))),
    countWhere(
      candidates as never,
      and(eq(candidates.organizationId, organizationId), eq(candidates.status, "active")),
    ),
    countWhere(
      placements as never,
      and(eq(placements.organizationId, organizationId), gte(placements.createdAt, thisMonth)),
    ),
    countWhere(
      placements as never,
      and(
        eq(placements.organizationId, organizationId),
        gte(placements.createdAt, lastMonth),
        lt(placements.createdAt, thisMonth),
      ),
    ),
    countWhere(
      candidates as never,
      and(eq(candidates.organizationId, organizationId), gte(candidates.createdAt, thisMonth)),
    ),
    countWhere(
      candidates as never,
      and(
        eq(candidates.organizationId, organizationId),
        gte(candidates.createdAt, lastMonth),
        lt(candidates.createdAt, thisMonth),
      ),
    ),
    countWhere(
      applications as never,
      and(
        eq(applications.organizationId, organizationId),
        inArray(applications.stage, INTERVIEW_STAGES),
      ),
    ),
    countWhere(
      applications as never,
      and(
        eq(applications.organizationId, organizationId),
        inArray(applications.stage, ACTIVE_STAGES),
      ),
    ),
    db
      .select({ stage: applications.stage, value: count() })
      .from(applications)
      .where(eq(applications.organizationId, organizationId))
      .groupBy(applications.stage),
    db
      .select({
        week: sql<string>`to_char(date_trunc('week', ${applications.createdAt}), 'YYYY-MM-DD')`,
        value: count(),
      })
      .from(applications)
      .where(
        and(
          eq(applications.organizationId, organizationId),
          gte(applications.createdAt, eightWeeksAgo),
        ),
      )
      .groupBy(sql`date_trunc('week', ${applications.createdAt})`)
      .orderBy(sql`date_trunc('week', ${applications.createdAt})`),
    db.query.auditLogs.findMany({
      where: eq(auditLogs.organizationId, organizationId),
      orderBy: [desc(auditLogs.createdAt)],
      limit: 8,
      with: { actor: { columns: { name: true } } },
    }),
    getCreditBalance(organizationId),
    getTenantPlan(organizationId),
    // Insight sources -----------------------------------------------------
    db.query.jobs.findMany({
      where: and(eq(jobs.organizationId, organizationId), eq(jobs.status, "open")),
      columns: { id: true, title: true },
      with: { applications: { columns: { id: true, stage: true } } },
    }),
    db.query.applications.findMany({
      where: and(
        eq(applications.organizationId, organizationId),
        inArray(applications.stage, ACTIVE_STAGES),
        lt(applications.updatedAt, new Date(Date.now() - 14 * 24 * 3600 * 1000)),
      ),
      columns: { id: true, stage: true },
      with: {
        candidate: { columns: { name: true } },
        job: { columns: { id: true, title: true } },
      },
      limit: 3,
    }),
    db.query.applications.findMany({
      where: and(
        eq(applications.organizationId, organizationId),
        eq(applications.stage, "offer"),
      ),
      with: {
        candidate: { columns: { name: true } },
        job: { columns: { id: true, title: true } },
      },
      limit: 3,
    }),
    db.query.jobs.findMany({
      where: and(eq(jobs.organizationId, organizationId), eq(jobs.status, "draft")),
      columns: { id: true, title: true },
      limit: 3,
    }),
  ]);

  // Funnel: collapse 9 stages into 6 readable tiers (current-state counts).
  const stageCount = new Map(stageRows.map((row) => [row.stage, row.value]));
  const tierDefs: Array<{ key: string; label: string; stages: HiringStage[] }> = [
    { key: "applied", label: "Applied", stages: ["applied"] },
    { key: "screening", label: "Screening", stages: ["screening"] },
    { key: "interviewing", label: "Interviewing", stages: INTERVIEW_STAGES },
    { key: "references", label: "References", stages: ["references"] },
    { key: "offer", label: "Offer", stages: ["offer"] },
    { key: "placed", label: "Placed", stages: ["placed"] },
  ];
  const inPipeline = tierDefs.reduce(
    (total, tier) => total + tier.stages.reduce((s, stage) => s + (stageCount.get(stage) ?? 0), 0),
    0,
  );
  const funnel: FunnelTier[] = tierDefs.map((tier) => {
    const tierTotal = tier.stages.reduce((s, stage) => s + (stageCount.get(stage) ?? 0), 0);
    return {
      key: tier.key,
      label: tier.label,
      count: tierTotal,
      share: inPipeline > 0 ? tierTotal / inPipeline : 0,
    };
  });

  // 8-week series with empty weeks filled.
  const weekMap = new Map(weeklyApplications.map((row) => [row.week, row.value]));
  const series: number[] = [];
  for (let i = 7; i >= 0; i--) {
    const week = new Date(Date.now() - i * 7 * 24 * 3600 * 1000);
    // Normalize to ISO week start (Monday) to match date_trunc('week').
    const day = week.getDay();
    week.setDate(week.getDate() - ((day + 6) % 7));
    const key = week.toISOString().slice(0, 10);
    series.push(weekMap.get(key) ?? 0);
  }

  // Rule-based insights — the "what needs my attention" panel.
  const insights: Insight[] = [];
  for (const job of jobsNeedingCandidates) {
    const active = job.applications.filter((a) => ACTIVE_STAGES.includes(a.stage as HiringStage));
    if (active.length === 0) {
      insights.push({
        severity: "action",
        title: `“${job.title}” has an empty pipeline`,
        detail: "An open role with no active candidates. Run AI matching to build a shortlist.",
        href: "/jobs",
        cta: "Run AI match",
      });
    }
  }
  for (const offer of offersOpen) {
    insights.push({
      severity: "action",
      title: `Offer out: ${offer.candidate.name}`,
      detail: `${offer.job.title} — chase the decision before momentum fades.`,
      href: `/pipeline?job=${offer.job.id}`,
      cta: "Open pipeline",
    });
  }
  for (const stale of staleApplications) {
    insights.push({
      severity: "watch",
      title: `${stale.candidate.name} is stalling`,
      detail: `No movement in 14+ days at ${stale.stage.replace(/_/g, " ")} for ${stale.job.title}.`,
      href: `/pipeline?job=${stale.job.id}`,
      cta: "Review",
    });
  }
  for (const draft of draftJobs) {
    insights.push({
      severity: "watch",
      title: `Draft job: ${draft.title}`,
      detail: "Not visible on your job board yet — publish when it's ready.",
      href: "/jobs",
      cta: "Open jobs",
    });
  }
  const monthlyAllowance = PLANS[planId].monthlyAiCredits;
  if (balance < monthlyAllowance * 0.1) {
    insights.push({
      severity: "action",
      title: "AI credits running low",
      detail: `${balance} credits left this month. Top up or upgrade to keep AI features available.`,
      href: "/billing",
      cta: "Open billing",
    });
  }

  return {
    kpis: {
      openJobs,
      activeCandidates,
      pipelineActive,
      interviewsActive,
      placements: { current: placementsNow, previous: placementsPrev } satisfies Trend,
      candidatesAdded: { current: candidatesNow, previous: candidatesPrev } satisfies Trend,
    },
    funnel,
    inPipeline,
    weeklyApplications: series,
    insights: insights.slice(0, 6),
    activity,
    credits: { balance, planId },
  };
}
