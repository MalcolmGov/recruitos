import { Coins, CreditCard, Gauge } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PLANS } from "@/lib/plans";
import { requireTenant } from "@/lib/session";
import { getBillingOverview } from "@/server/billing";

import { PlanCards } from "./plan-cards";

export const metadata = { title: "Billing" };

const reasonLabels: Record<string, string> = {
  monthly_grant: "Monthly allowance",
  plan_change: "Plan change",
  topup: "Top-up",
  consumption: "AI usage",
  adjustment: "Adjustment",
};

export default async function BillingPage() {
  const { organizationId } = await requireTenant();
  const overview = await getBillingOverview(organizationId);
  const plan = PLANS[overview.planId];

  const stats = [
    { label: "Current plan", value: plan.name, icon: CreditCard },
    { label: "AI credits available", value: String(overview.balance), icon: Coins },
    { label: "Credits used this month", value: String(overview.spentThisMonth), icon: Gauge },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Billing</h2>
        <p className="text-muted-foreground text-sm">
          Plan, AI credits and usage. AI actions cost credits: CV parse 2 · match 5 · copilot 1.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                {stat.label}
              </CardTitle>
              <stat.icon className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="font-mono text-2xl font-semibold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <PlanCards plans={Object.values(PLANS)} currentPlan={overview.planId} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Credit activity</CardTitle>
        </CardHeader>
        <CardContent>
          {overview.ledger.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              No credit activity yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Detail</TableHead>
                  <TableHead className="text-right">Credits</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overview.ledger.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {entry.createdAt.toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={entry.delta > 0 ? "secondary" : "outline"}>
                        {reasonLabels[entry.reason] ?? entry.reason}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {typeof entry.meta.feature === "string"
                        ? entry.meta.feature
                        : typeof entry.meta.plan === "string"
                          ? `plan: ${entry.meta.plan}`
                          : typeof entry.meta.to === "string"
                            ? `→ ${entry.meta.to}`
                            : "—"}
                    </TableCell>
                    <TableCell
                      className={`text-right font-mono text-sm ${entry.delta > 0 ? "text-success" : ""}`}
                    >
                      {entry.delta > 0 ? `+${entry.delta}` : entry.delta}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
