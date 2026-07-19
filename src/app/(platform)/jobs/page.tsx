import { desc, eq } from "drizzle-orm";
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

import { JobFormSheet } from "./job-form";

export const metadata = { title: "Jobs" };

const statusVariant = {
  open: "default",
  draft: "secondary",
  closed: "outline",
  filled: "outline",
} as const;

export default async function JobsPage() {
  const { organizationId } = await requireTenant();

  const [rows, clients] = await Promise.all([
    db.query.jobs.findMany({
      where: eq(jobs.organizationId, organizationId),
      orderBy: [desc(jobs.updatedAt)],
      with: {
        clientCompany: { columns: { name: true } },
        applications: { columns: { id: true, stage: true } },
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
        <JobFormSheet clients={clients} />
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
                        {row.applications.filter((a) => a.stage !== "rejected").length} active
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[row.status]}>{row.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <JobFormSheet
                        clients={clients}
                        initial={row}
                        trigger={
                          <Button variant="ghost" size="icon" aria-label={`Edit ${row.title}`}>
                            <Pencil className="size-4" />
                          </Button>
                        }
                      />
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
