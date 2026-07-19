import { and, count, desc, eq, gte, inArray } from "drizzle-orm";
import { Activity, Briefcase, Handshake, Users } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db";
import { applications, auditLogs, candidates, jobs, member, placements } from "@/db/schema";
import { BOARD_STAGES, STAGE_LABELS } from "@/lib/ats";
import { requireTenant } from "@/lib/session";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const { session, organizationId } = await requireTenant();

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [openJobs, activeCandidates, placementsMtd, teamCount, stageRows, recentActivity] =
    await Promise.all([
      db
        .select({ value: count() })
        .from(jobs)
        .where(and(eq(jobs.organizationId, organizationId), eq(jobs.status, "open"))),
      db
        .select({ value: count() })
        .from(candidates)
        .where(
          and(eq(candidates.organizationId, organizationId), eq(candidates.status, "active")),
        ),
      db
        .select({ value: count() })
        .from(placements)
        .where(
          and(
            eq(placements.organizationId, organizationId),
            gte(placements.createdAt, monthStart),
          ),
        ),
      db
        .select({ value: count() })
        .from(member)
        .where(eq(member.organizationId, organizationId)),
      db
        .select({ stage: applications.stage, value: count() })
        .from(applications)
        .innerJoin(jobs, eq(applications.jobId, jobs.id))
        .where(
          and(
            eq(applications.organizationId, organizationId),
            inArray(jobs.status, ["open", "draft"]),
          ),
        )
        .groupBy(applications.stage),
      db.query.auditLogs.findMany({
        where: eq(auditLogs.organizationId, organizationId),
        orderBy: [desc(auditLogs.createdAt)],
        limit: 8,
        with: { actor: { columns: { name: true } } },
      }),
    ]);

  const kpis = [
    { label: "Open jobs", value: openJobs[0]?.value ?? 0, icon: Briefcase, href: "/jobs" },
    {
      label: "Active candidates",
      value: activeCandidates[0]?.value ?? 0,
      icon: Users,
      href: "/candidates",
    },
    {
      label: "Placements MTD",
      value: placementsMtd[0]?.value ?? 0,
      icon: Handshake,
      href: "/placements",
    },
    { label: "Team members", value: teamCount[0]?.value ?? 0, icon: Activity, href: "/settings" },
  ];

  const stageCounts = new Map(stageRows.map((row) => [row.stage, row.value]));
  const activePipeline = BOARD_STAGES.filter((stage) => stage !== "rejected");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Welcome back, {session.user.name.split(" ")[0]}
        </h2>
        <p className="text-muted-foreground text-sm">
          Here&apos;s what&apos;s happening across your desk today.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <Link key={kpi.label} href={kpi.href}>
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-muted-foreground text-sm font-medium">
                  {kpi.label}
                </CardTitle>
                <kpi.icon className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="font-mono text-2xl font-semibold">{kpi.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hiring pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            {stageRows.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-sm">
                Add candidates to a job pipeline to see stage distribution here.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {activePipeline.map((stage) => {
                  const value = stageCounts.get(stage) ?? 0;
                  const max = Math.max(...activePipeline.map((s) => stageCounts.get(s) ?? 0), 1);
                  return (
                    <li key={stage} className="flex items-center gap-3">
                      <span className="text-muted-foreground w-32 shrink-0 text-xs">
                        {STAGE_LABELS[stage]}
                      </span>
                      <div className="bg-secondary h-2 flex-1 overflow-hidden rounded-full">
                        <div
                          className="bg-primary h-full rounded-full"
                          style={{ width: `${(value / max) * 100}%` }}
                        />
                      </div>
                      <span className="w-6 text-right font-mono text-xs">{value}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-sm">
                Tenant activity will appear here as your team works.
              </p>
            ) : (
              <ul className="space-y-3">
                {recentActivity.map((entry) => (
                  <li key={entry.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0">
                      <Badge variant="outline" className="mr-2 font-mono text-[10px]">
                        {entry.action}
                      </Badge>
                      <span className="text-muted-foreground">
                        {entry.actor?.name ?? "System"}
                        {typeof entry.metadata?.name === "string"
                          ? ` · ${entry.metadata.name}`
                          : typeof entry.metadata?.candidate === "string"
                            ? ` · ${entry.metadata.candidate}`
                            : ""}
                      </span>
                    </span>
                    <span className="text-muted-foreground shrink-0 font-mono text-xs">
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
      </div>
    </div>
  );
}
