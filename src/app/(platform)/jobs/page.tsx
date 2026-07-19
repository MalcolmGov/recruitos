import { and, desc, eq, ilike } from "drizzle-orm";
import { Globe, Pencil } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db } from "@/db";
import { clientCompanies, jobs } from "@/db/schema";
import { formatSalaryRange } from "@/lib/ats";
import { requireTenant } from "@/lib/session";
import { cn } from "@/lib/utils";
import { scoreJobRisk } from "@/server/intelligence";

import { QuickSearch } from "@/components/quick-search";

import { JobFormSheet } from "./job-form";
import { MatchDialog } from "./match-dialog";

export const metadata = { title: "Jobs" };

const statusVariant = {
  open: "default",
  draft: "secondary",
  closed: "outline",
  filled: "outline",
} as const;

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { organizationId } = await requireTenant();
  const { q } = await searchParams;

  const [rows, clients] = await Promise.all([
    db.query.jobs.findMany({
      where: and(
        eq(jobs.organizationId, organizationId),
        q ? ilike(jobs.title, `%${q}%`) : undefined,
      ),
      orderBy: [desc(jobs.updatedAt)],
      with: {
        clientCompany: { columns: { name: true } },
        applications: { columns: { id: true, stage: true, updatedAt: true } },
      },
    }),
    db.query.clientCompanies.findMany({
      where: eq(clientCompanies.organizationId, organizationId),
      columns: { id: true, name: true },
      orderBy: [clientCompanies.name],
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Jobs</h2>
          <p className="text-muted-foreground text-sm">
            {rows.filter((row) => row.status === "open").length} open of {rows.length} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <QuickSearch placeholder="Search jobs…" />
          <JobFormSheet clients={clients} />
        </div>
      </div>

      <Card>
        <CardContent className="pt-2">
          {rows.length === 0 ? (
            <p className="text-muted-foreground py-16 text-center text-sm">
              No jobs yet — create your first role.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Salary / rate</TableHead>
                  <TableHead>Pipeline</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="font-medium">{row.title}</div>
                      <div className="text-muted-foreground flex items-center gap-1 text-xs">
                        {row.published ? <Globe className="size-3" /> : null}
                        {row.location ?? row.workMode}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.clientCompany?.name ?? "—"}
                    </TableCell>
                    <TableCell className="capitalize">{row.type}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {formatSalaryRange(row.salaryMin, row.salaryMax, row.currency)}
                    </TableCell>
                    <TableCell>
                      <Link href={`/pipeline?job=${row.id}`} className="text-primary hover:underline">
                        {
                          row.applications.filter(
                            (a) => a.stage !== "rejected" && a.stage !== "placed",
                          ).length
                        }{" "}
                        active
                      </Link>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const risk = scoreJobRisk(row);
                        if (risk.score === 0)
                          return <span className="text-muted-foreground text-xs">—</span>;
                        return (
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2 py-px font-mono text-xs font-semibold",
                              risk.level === "high"
                                ? "bg-destructive/12 text-destructive"
                                : risk.level === "medium"
                                  ? "bg-warning/15 text-[oklch(0.6_0.14_70)] dark:text-warning"
                                  : "bg-success/12 text-success",
                            )}
                            title={risk.reasons.join(" · ")}
                          >
                            {risk.score}
                          </span>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[row.status]}>{row.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <MatchDialog jobId={row.id} jobTitle={row.title} />
                        <JobFormSheet
                          clients={clients}
                          initial={row}
                          trigger={
                            <Button variant="ghost" size="icon" aria-label={`Edit ${row.title}`}>
                              <Pencil className="size-4" />
                            </Button>
                          }
                        />
                      </div>
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
