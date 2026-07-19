import "server-only";

import { and, count, desc, eq, gte, inArray, sql } from "drizzle-orm";

import { db } from "@/db";
import { applications, auditLogs, jobs, placements } from "@/db/schema";
import { getCreditBalance } from "@/server/billing";

/**
 * The rule-based decision engine behind "what should the recruiter do next?".
 * Every number here is computed from real tenant data — actions are scored by
 * urgency × impact, risk is explained by its reasons, and the forecast is a
 * labeled run-rate extrapolation, never an invented prediction.
 */

const DAY_MS = 86_400_000;
const days = (from: Date) => Math.floor((Date.now() - from.getTime()) / DAY_MS);

/**
 * Pure risk scorer shared by the dashboard panel and the jobs table — one set
 * of rules, one number, everywhere.
 */
export function scoreJobRisk(job: {
  status: string;
  createdAt: Date;
  applications: { stage: string; updatedAt: Date }[];
}): { score: number; level: "high" | "medium" | "low"; reasons: string[] } {
  if (job.status !== "open") return { score: 0, level: "low", reasons: [] };
  const active = job.applications.filter(
    (a) => a.stage !== "rejected" && a.stage !== "placed",
  );
  const age = days(job.createdAt);
  const newestMove = active.length ? Math.min(...active.map((a) => days(a.updatedAt))) : null;
  const interviewing = active.filter((a) =>
    ["interview_1", "interview_2", "technical", "references", "offer"].includes(a.stage),
  ).length;

  let score = 0;
  const reasons: string[] = [];
  if (active.length === 0) {
    score += 45;
    reasons.push("no active candidates");
  }
  if (age > 30) {
    score += Math.min(Math.floor((age - 30) / 10) * 10 + 15, 30);
    reasons.push(`open ${age}d`);
  }
  if (newestMove !== null && newestMove >= 14) {
    score += 20;
    reasons.push(`no movement ${newestMove}d`);
  }
  if (active.length > 0 && interviewing === 0) {
    score += 15;
    reasons.push("nobody past screening");
  }
  score = Math.min(score, 100);
  return { score, level: score >= 60 ? "high" : score >= 30 ? "medium" : "low", reasons };
}

export type NextAction = {
  rank: number;
  score: number;
  impact: "critical" | "high" | "medium";
  title: string;
  detail: string;
  href: string;
  cta: string;
  ageDays: number | null;
};

export type JobRisk = {
  jobId: string;
  title: string;
  clientName: string | null;
  /** 0–100, higher = more likely to stall or lose the mandate */
  score: number;
  level: "high" | "medium" | "low";
  reasons: string[];
  ageDays: number;
  activeCandidates: number;
};

export type Forecast = {
  monthPlacements: number;
  monthProjected: number;
  monthFees: number;
  monthFeesProjected: number;
  quarterFeesProjected: number;
  basis: string;
};

export type StageVelocity = {
  stage: string;
  medianDays: number;
  samples: number;
};

export type TickerItem = {
  label: string;
  value: string;
  delta?: { direction: "up" | "down" | "flat"; text: string };
  tone?: "positive" | "negative" | "neutral";
};

export type Intelligence = {
  actions: NextAction[];
  jobRisks: JobRisk[];
  forecast: Forecast;
  velocity: StageVelocity[];
  ticker: TickerItem[];
  briefing: string[];
};

const gbp = (value: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);

export async function getIntelligence(organizationId: string): Promise<Intelligence> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

  const [openJobs, draftJobs, activeApps, monthPlacementRows, recentPlacementRows, moveRows, credits] =
    await Promise.all([
      db.query.jobs.findMany({
        where: and(eq(jobs.organizationId, organizationId), eq(jobs.status, "open")),
        columns: { id: true, title: true, createdAt: true, updatedAt: true },
        with: {
          clientCompany: { columns: { name: true } },
          applications: { columns: { id: true, stage: true, updatedAt: true } },
        },
      }),
      db.query.jobs.findMany({
        where: and(eq(jobs.organizationId, organizationId), eq(jobs.status, "draft")),
        columns: { id: true, title: true, updatedAt: true },
      }),
      db.query.applications.findMany({
        where: and(
          eq(applications.organizationId, organizationId),
          inArray(applications.stage, [
            "applied",
            "screening",
            "interview_1",
            "interview_2",
            "technical",
            "references",
            "offer",
          ]),
        ),
        columns: { id: true, stage: true, updatedAt: true, jobId: true },
        with: {
          candidate: { columns: { name: true } },
          job: { columns: { id: true, title: true } },
        },
      }),
      db
        .select({ fees: sql<number>`coalesce(sum(${placements.fee}), 0)`, n: count() })
        .from(placements)
        .where(
          and(eq(placements.organizationId, organizationId), gte(placements.createdAt, monthStart)),
        ),
      db
        .select({
          month: sql<string>`to_char(date_trunc('month', ${placements.createdAt}), 'YYYY-MM')`,
          fees: sql<number>`coalesce(sum(${placements.fee}), 0)`,
          n: count(),
        })
        .from(placements)
        .where(
          and(
            eq(placements.organizationId, organizationId),
            gte(placements.createdAt, threeMonthsAgo),
          ),
        )
        .groupBy(sql`date_trunc('month', ${placements.createdAt})`),
      // Observed stage transitions → velocity. Only audited moves count; we
      // never infer durations for moves that predate the audit trail.
      db
        .select({
          applicationId: auditLogs.entityId,
          stage: sql<string>`${auditLogs.metadata}->>'stage'`,
          createdAt: auditLogs.createdAt,
        })
        .from(auditLogs)
        .where(
          and(eq(auditLogs.organizationId, organizationId), eq(auditLogs.action, "pipeline.moved")),
        )
        .orderBy(desc(auditLogs.createdAt))
        .limit(500),
      getCreditBalance(organizationId),
    ]);

  // ------------------------------------------------------------- actions ---
  const actions: Omit<NextAction, "rank">[] = [];

  for (const app of activeApps) {
    const age = days(app.updatedAt);
    if (app.stage === "offer") {
      actions.push({
        score: 90 + Math.min(age * 2, 30),
        impact: age >= 5 ? "critical" : "high",
        title: `Chase offer: ${app.candidate.name}`,
        detail: `${app.job.title} — offer out ${age === 0 ? "today" : `${age}d ago`}. Every day cold cuts acceptance odds.`,
        href: `/pipeline?job=${app.job.id}`,
        cta: "Chase now",
        ageDays: age,
      });
    } else if (age >= 14) {
      actions.push({
        score: 55 + Math.min(age, 30),
        impact: age >= 21 ? "high" : "medium",
        title: `Unblock ${app.candidate.name}`,
        detail: `Sitting at ${app.stage.replace(/_/g, " ")} for ${age}d on ${app.job.title}. Move, message or release.`,
        href: `/pipeline?job=${app.job.id}`,
        cta: "Review",
        ageDays: age,
      });
    }
  }

  for (const job of openJobs) {
    const active = job.applications.filter(
      (a) => a.stage !== "rejected" && a.stage !== "placed",
    ).length;
    if (active === 0) {
      actions.push({
        score: 75 + Math.min(days(job.createdAt), 20),
        impact: "high",
        title: `Build a shortlist: ${job.title}`,
        detail: `Open ${days(job.createdAt)}d with zero active candidates. Run AI matching to seed the pipeline.`,
        href: "/jobs",
        cta: "Run AI match",
        ageDays: days(job.updatedAt),
      });
    }
  }

  for (const draft of draftJobs) {
    actions.push({
      score: 45 + Math.min(days(draft.updatedAt), 15),
      impact: "medium",
      title: `Publish: ${draft.title}`,
      detail: `Draft for ${days(draft.updatedAt)}d — invisible to your job board and feeds until published.`,
      href: "/jobs",
      cta: "Open jobs",
      ageDays: days(draft.updatedAt),
    });
  }

  if (credits < 20) {
    actions.push({
      score: 60,
      impact: "high",
      title: "AI credits running low",
      detail: `${credits} credits left — CV parsing and matching will stop when they hit zero.`,
      href: "/billing",
      cta: "Top up",
      ageDays: null,
    });
  }

  const rankedActions: NextAction[] = actions
    .sort((a, b) => b.score - a.score)
    .slice(0, 7)
    .map((action, index) => ({ ...action, rank: index + 1 }));

  // ------------------------------------------------------------ job risk ---
  const jobRisks: JobRisk[] = openJobs
    .map((job) => {
      const { score, level, reasons } = scoreJobRisk({ ...job, status: "open" });
      return {
        jobId: job.id,
        title: job.title,
        clientName: job.clientCompany?.name ?? null,
        score,
        level,
        reasons,
        ageDays: days(job.createdAt),
        activeCandidates: job.applications.filter(
          (a) => a.stage !== "rejected" && a.stage !== "placed",
        ).length,
      };
    })
    .filter((risk) => risk.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  // ------------------------------------------------------------ forecast ---
  const monthFees = Number(monthPlacementRows[0]?.fees ?? 0);
  const monthPlacementCount = Number(monthPlacementRows[0]?.n ?? 0);
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthProjected = Math.round((monthPlacementCount / dayOfMonth) * daysInMonth);
  const monthFeesProjected = Math.round((monthFees / dayOfMonth) * daysInMonth);

  const trailingMonths = recentPlacementRows.filter(
    (row) => row.month !== `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
  );
  const avgMonthlyFees = trailingMonths.length
    ? trailingMonths.reduce((sum, row) => sum + Number(row.fees), 0) / trailingMonths.length
    : monthFeesProjected;
  const monthsLeftInQuarter =
    2 - (now.getMonth() - quarterStart.getMonth());
  const quarterFeesToDate = recentPlacementRows
    .filter((row) => row.month >= `${quarterStart.getFullYear()}-${String(quarterStart.getMonth() + 1).padStart(2, "0")}`)
    .reduce((sum, row) => sum + Number(row.fees), 0);
  const quarterFeesProjected = Math.round(
    quarterFeesToDate + (daysInMonth - dayOfMonth) * (monthFees / dayOfMonth || avgMonthlyFees / daysInMonth) + monthsLeftInQuarter * avgMonthlyFees,
  );

  const forecast: Forecast = {
    monthPlacements: monthPlacementCount,
    monthProjected,
    monthFees,
    monthFeesProjected,
    quarterFeesProjected,
    basis: "run-rate from booked placements — not a promise",
  };

  // ------------------------------------------------------------ velocity ---
  // Median days an application waited before each observed move.
  const movesByApp = new Map<string, { stage: string; at: Date }[]>();
  for (const row of moveRows) {
    if (!row.applicationId || !row.stage) continue;
    const list = movesByApp.get(row.applicationId) ?? [];
    list.push({ stage: row.stage, at: row.createdAt });
    movesByApp.set(row.applicationId, list);
  }
  const waits = new Map<string, number[]>();
  for (const list of movesByApp.values()) {
    const ordered = list.slice().sort((a, b) => a.at.getTime() - b.at.getTime());
    for (let i = 1; i < ordered.length; i++) {
      const waited = (ordered[i].at.getTime() - ordered[i - 1].at.getTime()) / DAY_MS;
      const bucket = waits.get(ordered[i].stage) ?? [];
      bucket.push(waited);
      waits.set(ordered[i].stage, bucket);
    }
  }
  const velocity: StageVelocity[] = [...waits.entries()]
    .map(([stage, samples]) => {
      const sorted = samples.slice().sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];
      return { stage: stage.replace(/_/g, " "), medianDays: Math.round(median * 10) / 10, samples: samples.length };
    })
    .sort((a, b) => b.samples - a.samples)
    .slice(0, 5);

  // -------------------------------------------------------------- ticker ---
  const inPlay = activeApps.length;
  const offersOut = activeApps.filter((a) => a.stage === "offer").length;
  const interviewing = activeApps.filter((a) =>
    ["interview_1", "interview_2", "technical"].includes(a.stage),
  ).length;
  const highRisk = jobRisks.filter((r) => r.level === "high").length;

  const ticker: TickerItem[] = [
    { label: "OPEN ROLES", value: String(openJobs.length) },
    { label: "IN PLAY", value: String(inPlay) },
    { label: "INTERVIEWING", value: String(interviewing) },
    {
      label: "OFFERS OUT",
      value: String(offersOut),
      tone: offersOut > 0 ? "positive" : "neutral",
    },
    {
      label: "HIGH RISK",
      value: String(highRisk),
      tone: highRisk > 0 ? "negative" : "positive",
    },
    { label: "FEES MTD", value: gbp(monthFees) },
    {
      label: "PROJ MONTH",
      value: gbp(monthFeesProjected),
      delta:
        monthFeesProjected >= monthFees
          ? { direction: "up", text: "run-rate" }
          : { direction: "flat", text: "run-rate" },
    },
    { label: "AI CREDITS", value: String(credits), tone: credits < 20 ? "negative" : "neutral" },
  ];

  // ------------------------------------------------------------ briefing ---
  const briefing: string[] = [];
  if (rankedActions.length > 0) {
    briefing.push(
      `${rankedActions.length} action${rankedActions.length === 1 ? "" : "s"} queued — top priority: ${rankedActions[0].title.toLowerCase()}.`,
    );
  } else {
    briefing.push("Queue is clear — no urgent actions detected.");
  }
  if (offersOut > 0) {
    briefing.push(`${offersOut} offer${offersOut === 1 ? "" : "s"} awaiting a decision.`);
  }
  if (highRisk > 0) {
    briefing.push(
      `${highRisk} role${highRisk === 1 ? "" : "s"} flagged high-risk: ${jobRisks
        .filter((r) => r.level === "high")
        .map((r) => r.title)
        .slice(0, 2)
        .join(", ")}.`,
    );
  }
  if (monthPlacementCount > 0) {
    briefing.push(
      `${monthPlacementCount} placement${monthPlacementCount === 1 ? "" : "s"} booked this month (${gbp(monthFees)}) — run-rate projects ${gbp(monthFeesProjected)}.`,
    );
  }

  return { actions: rankedActions, jobRisks, forecast, velocity, ticker, briefing };
}
