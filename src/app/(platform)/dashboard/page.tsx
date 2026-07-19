import Link from "next/link";

import { AttentionPanel } from "@/components/dashboard/attention-panel";
import { MonthlyPlacementsBars, SourceDonut } from "@/components/dashboard/charts";
import { CopilotPanel } from "@/components/dashboard/copilot-panel";
import { PipelineFunnel } from "@/components/dashboard/funnel";
import { HiringActivity } from "@/components/dashboard/hiring-activity";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { ActivityTimeline, TopJobs } from "@/components/dashboard/side-cards";
import { Badge } from "@/components/ui/badge";
import { requireTenant } from "@/lib/session";
import { getDashboardData } from "@/server/dashboard";

export const metadata = { title: "Dashboard" };

const actionLabels: Record<string, string> = {
  "pipeline.moved": "moved",
  "pipeline.added": "added to pipeline",
  "candidate.created": "added candidate",
  "candidate.updated": "updated candidate",
  "job.created": "created job",
  "job.updated": "updated job",
  "client.created": "added client",
  "client.updated": "updated client",
  "placement.updated": "updated placement",
  "settings.updated": "updated settings",
  "integration.saved": "configured integration",
  "billing.plan_changed": "changed plan",
  "billing.topup": "topped up credits",
  "ai.cv_parsed": "parsed a CV",
  "ai.matched": "ran AI matching",
};

export default async function DashboardPage() {
  const { session, organizationId } = await requireTenant();
  const data = await getDashboardData(organizationId);

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  })();

  const activityEntries = data.activity.map((entry) => {
    const subject =
      typeof entry.metadata?.candidate === "string"
        ? entry.metadata.candidate
        : typeof entry.metadata?.name === "string"
          ? entry.metadata.name
          : typeof entry.metadata?.title === "string"
            ? entry.metadata.title
            : "";
    const stage =
      typeof entry.metadata?.stage === "string"
        ? ` → ${entry.metadata.stage.replace(/_/g, " ")}`
        : "";
    return {
      id: entry.id,
      actorName: entry.actor?.name ?? "System",
      text: `${actionLabels[entry.action] ?? entry.action} ${subject}${stage}`.trim(),
      createdAt: entry.createdAt,
    };
  });

  return (
    <div className="space-y-6">
      <div className="animate-fade-up flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            {greeting}, {session.user.name.split(" ")[0]} 👋
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {new Date().toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}{" "}
            · here&apos;s your desk at a glance.
          </p>
        </div>
        <Link
          href="/billing"
          className="text-muted-foreground hover:text-foreground text-xs transition-colors"
        >
          <Badge variant="outline" className="gap-1.5 font-normal">
            <span className="bg-success inline-block size-1.5 rounded-full" />
            {data.credits.balance} AI credits
          </Badge>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Placements this month"
          value={data.kpis.placements.current}
          trend={data.kpis.placements}
          chart={{ type: "bars", points: data.monthlyPlacements }}
          icon="handshake"
          tone="emerald"
          href="/placements"
          hint="last 4 months · vs last month"
        />
        <KpiCard
          label="Candidates in play"
          value={data.kpis.pipelineActive}
          chart={{ type: "area", points: data.weeklyApplications }}
          icon="kanban"
          tone="blue"
          href="/pipeline"
          hint="pipeline intake · 12 weeks"
        />
        <KpiCard
          label="Interviews in progress"
          value={data.kpis.interviewsActive}
          chart={{ type: "donut", points: data.interviewsBreakdown }}
          icon="calendar"
          tone="violet"
          href="/pipeline"
          hint="by interview stage"
        />
        <KpiCard
          label="New candidates this month"
          value={data.kpis.candidatesAdded.current}
          trend={data.kpis.candidatesAdded}
          chart={{ type: "area", points: data.weeklyCandidates }}
          icon="user-plus"
          tone="amber"
          href="/candidates"
          hint="candidates added · 12 weeks"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <HiringActivity series={data.activitySeries} stats={data.activityStats} />
        </div>
        <CopilotPanel firstName={session.user.name.split(" ")[0]} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <AttentionPanel insights={data.insights} />
        <ActivityTimeline entries={activityEntries} />
        <TopJobs jobs={data.topJobs} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <PipelineFunnel funnel={data.funnel} total={data.inPipeline} />
        <MonthlyPlacementsBars months={data.monthlyPlacements} />
        <SourceDonut slices={data.sources} />
      </div>
    </div>
  );
}
