import { Briefcase, Handshake, Users } from "lucide-react";
import Link from "next/link";

import { AttentionPanel } from "@/components/dashboard/attention-panel";
import {
  ActivityAreaChart,
  MonthlyPlacementsBars,
  SourceDonut,
} from "@/components/dashboard/charts";
import { PipelineFunnel } from "@/components/dashboard/funnel";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireTenant } from "@/lib/session";
import { getDashboardData } from "@/server/dashboard";

export const metadata = { title: "Dashboard" };

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

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

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="animate-fade-up flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            {greeting}, {session.user.name.split(" ")[0]}
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
          icon="handshake"
          tone="emerald"
          href="/placements"
          hint="vs last month"
        />
        <KpiCard
          label="Candidates in play"
          value={data.kpis.pipelineActive}
          sparkline={data.weeklyApplications}
          icon="kanban"
          tone="blue"
          href="/pipeline"
          hint="8-week intake trend"
        />
        <KpiCard
          label="Interviews in progress"
          value={data.kpis.interviewsActive}
          icon="calendar"
          tone="violet"
          href="/pipeline"
        />
        <KpiCard
          label="New candidates this month"
          value={data.kpis.candidatesAdded.current}
          trend={data.kpis.candidatesAdded}
          icon="user-plus"
          tone="amber"
          href="/candidates"
          hint="vs last month"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ActivityAreaChart points={data.weeklyApplications} />
        </div>
        <div className="lg:col-span-2">
          <AttentionPanel insights={data.insights} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <PipelineFunnel funnel={data.funnel} total={data.inPipeline} />
        <MonthlyPlacementsBars months={data.monthlyPlacements} />
        <SourceDonut slices={data.sources} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="animate-fade-up lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            {data.activity.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-sm">
                Activity from your team lands here.
              </p>
            ) : (
              <ul className="space-y-3">
                {data.activity.map((entry) => (
                  <li key={entry.id} className="flex items-center gap-3 text-sm">
                    <Avatar className="size-7">
                      <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                        {initials(entry.actor?.name ?? "S")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 flex-1 truncate">
                      <span className="font-medium">{entry.actor?.name ?? "System"}</span>{" "}
                      <span className="text-muted-foreground">
                        {actionLabels[entry.action] ?? entry.action}
                      </span>{" "}
                      {typeof entry.metadata?.candidate === "string" ? (
                        <span className="font-medium">{entry.metadata.candidate}</span>
                      ) : typeof entry.metadata?.name === "string" ? (
                        <span className="font-medium">{entry.metadata.name}</span>
                      ) : typeof entry.metadata?.title === "string" ? (
                        <span className="font-medium">{entry.metadata.title}</span>
                      ) : null}
                      {typeof entry.metadata?.stage === "string" ? (
                        <span className="text-muted-foreground">
                          {" "}
                          → {entry.metadata.stage.replace(/_/g, " ")}
                        </span>
                      ) : null}
                    </span>
                    <span className="text-muted-foreground shrink-0 font-mono text-[11px]">
                      {entry.createdAt.toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="animate-fade-up">
          <CardHeader>
            <CardTitle className="text-base">Snapshot</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground flex items-center gap-2">
                  <Briefcase className="size-3.5" /> Open jobs
                </dt>
                <dd className="font-mono font-semibold">{data.kpis.openJobs}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground flex items-center gap-2">
                  <Users className="size-3.5" /> Active talent pool
                </dt>
                <dd className="font-mono font-semibold">{data.kpis.activeCandidates}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground flex items-center gap-2">
                  <Handshake className="size-3.5" /> Offers outstanding
                </dt>
                <dd className="font-mono font-semibold">
                  {data.funnel.find((tier) => tier.key === "offer")?.count ?? 0}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
