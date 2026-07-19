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
  at?: Date;
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
  const twelveWeeksAgo = new Date(Date.now() - 12 * 7 * 24 * 3600 * 1000);
  const fourMonthsAgo = monthStart(-3);

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
    weeklyCandidateRows,
    sourceRows,
    monthlyPlacementRows,
    weeklyPlacementRows,
    weeklyOfferMoveRows,
    weeklyScreeningMoveRows,
    weeklyInterviewMoveRows,
    stats12wk,
    topJobRows,
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
          gte(applications.createdAt, twelveWeeksAgo),
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
    db
      .select({
        week: sql<string>`to_char(date_trunc('week', ${candidates.createdAt}), 'YYYY-MM-DD')`,
        value: count(),
      })
      .from(candidates)
      .where(
        and(
          eq(candidates.organizationId, organizationId),
          gte(candidates.createdAt, twelveWeeksAgo),
        ),
      )
      .groupBy(sql`date_trunc('week', ${candidates.createdAt})`)
      .orderBy(sql`date_trunc('week', ${candidates.createdAt})`),
    db
      .select({ source: candidates.source, value: count() })
      .from(candidates)
      .where(eq(candidates.organizationId, organizationId))
      .groupBy(candidates.source),
    db
      .select({
        month: sql<string>`to_char(date_trunc('month', ${placements.createdAt}), 'YYYY-MM')`,
        value: count(),
        fees: sql<string>`coalesce(sum(${placements.fee}), 0)`,
      })
      .from(placements)
      .where(
        and(
          eq(placements.organizationId, organizationId),
          gte(placements.createdAt, fourMonthsAgo),
        ),
      )
      .groupBy(sql`date_trunc('month', ${placements.createdAt})`)
      .orderBy(sql`date_trunc('month', ${placements.createdAt})`),
    db
      .select({
        week: sql<string>`to_char(date_trunc('week', ${placements.createdAt}), 'YYYY-MM-DD')`,
        value: count(),
      })
      .from(placements)
      .where(
        and(
          eq(placements.organizationId, organizationId),
          gte(placements.createdAt, twelveWeeksAgo),
        ),
      )
      .groupBy(sql`date_trunc('week', ${placements.createdAt})`),
    db
      .select({
        week: sql<string>`to_char(date_trunc('week', ${auditLogs.createdAt}), 'YYYY-MM-DD')`,
        value: count(),
      })
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.organizationId, organizationId),
          eq(auditLogs.action, "pipeline.moved"),
          sql`${auditLogs.metadata}->>'stage' = 'offer'`,
          gte(auditLogs.createdAt, twelveWeeksAgo),
        ),
      )
      .groupBy(sql`date_trunc('week', ${auditLogs.createdAt})`),
    db
      .select({
        week: sql<string>`to_char(date_trunc('week', ${auditLogs.createdAt}), 'YYYY-MM-DD')`,
        value: count(),
      })
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.organizationId, organizationId),
          eq(auditLogs.action, "pipeline.moved"),
          sql`${auditLogs.metadata}->>'stage' = 'screening'`,
          gte(auditLogs.createdAt, twelveWeeksAgo),
        ),
      )
      .groupBy(sql`date_trunc('week', ${auditLogs.createdAt})`),
    db
      .select({
        week: sql<string>`to_char(date_trunc('week', ${auditLogs.createdAt}), 'YYYY-MM-DD')`,
        value: count(),
      })
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.organizationId, organizationId),
          eq(auditLogs.action, "pipeline.moved"),
          sql`${auditLogs.metadata}->>'stage' in ('interview_1','interview_2','technical')`,
          gte(auditLogs.createdAt, twelveWeeksAgo),
        ),
      )
      .groupBy(sql`date_trunc('week', ${auditLogs.createdAt})`),
    Promise.all([
      db
        .select({ value: count() })
        .from(jobs)
        .where(and(eq(jobs.organizationId, organizationId), gte(jobs.createdAt, twelveWeeksAgo))),
      db
        .select({ value: count() })
        .from(applications)
        .where(
          and(
            eq(applications.organizationId, organizationId),
            gte(applications.createdAt, twelveWeeksAgo),
          ),
        ),
      db
        .select({ value: count() })
        .from(auditLogs)
        .where(
          and(
            eq(auditLogs.organizationId, organizationId),
            eq(auditLogs.action, "pipeline.moved"),
            sql`${auditLogs.metadata}->>'stage' in ('interview_1','interview_2','technical')`,
            gte(auditLogs.createdAt, twelveWeeksAgo),
          ),
        ),
      db
        .select({ value: count() })
        .from(auditLogs)
        .where(
          and(
            eq(auditLogs.organizationId, organizationId),
            eq(auditLogs.action, "pipeline.moved"),
            sql`${auditLogs.metadata}->>'stage' = 'offer'`,
            gte(auditLogs.createdAt, twelveWeeksAgo),
          ),
        ),
      db
        .select({ value: count() })
        .from(placements)
        .where(
          and(
            eq(placements.organizationId, organizationId),
            gte(placements.createdAt, twelveWeeksAgo),
          ),
        ),
    ]),
    db.query.jobs.findMany({
      where: and(eq(jobs.organizationId, organizationId), inArray(jobs.status, ["open", "filled"])),
      columns: { id: true, title: true, status: true },
      with: { applications: { columns: { id: true, stage: true } } },
    }),
    // Insight sources -----------------------------------------------------
    db.query.jobs.findMany({
      where: and(eq(jobs.organizationId, organizationId), eq(jobs.status, "open")),
      columns: { id: true, title: true, updatedAt: true },
      with: { applications: { columns: { id: true, stage: true } } },
    }),
    db.query.applications.findMany({
      where: and(
        eq(applications.organizationId, organizationId),
        inArray(applications.stage, ACTIVE_STAGES),
        lt(applications.updatedAt, new Date(Date.now() - 14 * 24 * 3600 * 1000)),
      ),
      columns: { id: true, stage: true, updatedAt: true },
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
      columns: { id: true, title: true, updatedAt: true },
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

  // 12-week series with empty weeks filled.
  const weekMap = new Map(weeklyApplications.map((row) => [row.week, row.value]));
  const series: number[] = [];
  for (let i = 11; i >= 0; i--) {
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
        at: job.updatedAt,
      });
    }
  }
  for (const offer of offersOpen) {
    insights.push({
      severity: "action",
      title: `Offer out: ${offer.candidate.name}`,
      detail: `${offer.job.title} — decision pending.`,
      href: `/pipeline?job=${offer.job.id}`,
      cta: "Open pipeline",
      at: offer.updatedAt,
    });
  }
  for (const stale of staleApplications) {
    insights.push({
      severity: "watch",
      title: `${stale.candidate.name} is stalling`,
      detail: `No movement in 14+ days at ${stale.stage.replace(/_/g, " ")} for ${stale.job.title}.`,
      href: `/pipeline?job=${stale.job.id}`,
      cta: "Review",
      at: stale.updatedAt,
    });
  }
  for (const draft of draftJobs) {
    insights.push({
      severity: "watch",
      title: `Draft job: ${draft.title}`,
      detail: "Not visible on your job board yet — publish when it's ready.",
      href: "/jobs",
      cta: "Open jobs",
      at: draft.updatedAt,
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

  const fillWeeks = (rows: { week: string; value: number }[]): number[] => {
    const map = new Map(rows.map((row) => [row.week, row.value]));
    const series: number[] = [];
    for (let i = 11; i >= 0; i--) {
      const week = new Date(Date.now() - i * 7 * 24 * 3600 * 1000);
      const day = week.getDay();
      week.setDate(week.getDate() - ((day + 6) % 7));
      series.push(map.get(week.toISOString().slice(0, 10)) ?? 0);
    }
    return series;
  };
  const candidateSeries = fillWeeks(weeklyCandidateRows);

  const interviewsBreakdown = [
    { label: "1st interview", value: stageCount.get("interview_1") ?? 0 },
    { label: "2nd interview", value: stageCount.get("interview_2") ?? 0 },
    { label: "Technical", value: stageCount.get("technical") ?? 0 },
  ];

  // Candidates by source: top 4 + Other (fixed slice order = fixed hue order).
  const sortedSources = [...sourceRows]
    .map((row) => ({ label: row.source ?? "Unknown", value: row.value }))
    .sort((a, b) => b.value - a.value);
  const topSources = sortedSources.slice(0, 4);
  const otherTotal = sortedSources.slice(4).reduce((total, row) => total + row.value, 0);
  const sources = otherTotal > 0 ? [...topSources, { label: "Other", value: otherTotal }] : topSources;

  // Last 4 calendar months of placements, empty months filled.
  const monthMap = new Map(
    monthlyPlacementRows.map((row) => [row.month, { value: row.value, fees: Number(row.fees) }]),
  );
  const monthlyPlacements = Array.from({ length: 4 }, (_, index) => {
    const date = monthStart(index - 3);
    const key = date.toISOString().slice(0, 7);
    const entry = monthMap.get(key);
    return {
      label: date.toLocaleDateString("en-GB", { month: "short" }),
      value: entry?.value ?? 0,
      fees: entry?.fees ?? 0,
    };
  });

  const [jobs12wk, applications12wk, interviews12wk, offers12wk, placements12wk] = stats12wk;
  const topJobs = topJobRows
    .map((job) => ({
      id: job.id,
      title: job.title,
      status: job.status,
      applications: job.applications.length,
    }))
    .sort((a, b) => b.applications - a.applications)
    .slice(0, 5);

  return {
    sources,
    monthlyPlacements,
    weeklyCandidates: candidateSeries,
    interviewsBreakdown,
    activitySeries: {
      applications: series,
      screenings: fillWeeks(weeklyScreeningMoveRows),
      interviews: fillWeeks(weeklyInterviewMoveRows),
      offers: fillWeeks(weeklyOfferMoveRows),
      placements: fillWeeks(weeklyPlacementRows),
    },
    activityStats: {
      newJobs: jobs12wk[0]?.value ?? 0,
      applications: applications12wk[0]?.value ?? 0,
      interviews: interviews12wk[0]?.value ?? 0,
      offers: offers12wk[0]?.value ?? 0,
      placements: placements12wk[0]?.value ?? 0,
    },
    topJobs,
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
