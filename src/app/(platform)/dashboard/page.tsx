import { count, desc, eq } from "drizzle-orm";
import {
  Activity,
  Briefcase,
  Handshake,
  Users,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db";
import { auditLogs, member } from "@/db/schema";
import { requireTenant } from "@/lib/session";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const { session, organizationId } = await requireTenant();

  const [teamCount, recentActivity] = await Promise.all([
    db
      .select({ value: count() })
      .from(member)
      .where(eq(member.organizationId, organizationId)),
    db.query.auditLogs.findMany({
      where: eq(auditLogs.organizationId, organizationId),
      orderBy: [desc(auditLogs.createdAt)],
      limit: 8,
    }),
  ]);

  const kpis = [
    { label: "Open jobs", value: 0, icon: Briefcase, hint: "Jobs module — Phase 3" },
    { label: "Active candidates", value: 0, icon: Users, hint: "Candidates module — Phase 3" },
    { label: "Placements MTD", value: 0, icon: Handshake, hint: "Placements module — Phase 3" },
    {
      label: "Team members",
      value: teamCount[0]?.value ?? 0,
      icon: Activity,
      hint: "Live",
    },
  ];

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
          <Card key={kpi.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                {kpi.label}
              </CardTitle>
              <kpi.icon className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="font-mono text-2xl font-semibold">{kpi.value}</div>
              <p className="text-muted-foreground text-xs">{kpi.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
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
                  <li key={entry.id} className="flex items-center justify-between text-sm">
                    <span>
                      <span className="font-medium">{entry.action}</span>{" "}
                      <span className="text-muted-foreground">on {entry.entityType}</span>
                    </span>
                    <span className="text-muted-foreground font-mono text-xs">
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
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hiring pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground py-8 text-center text-sm">
              Pipeline analytics activate with the Recruitment module in Phase 3.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
