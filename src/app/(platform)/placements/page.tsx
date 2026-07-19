import { desc, eq } from "drizzle-orm";

import { Badge } from "@/components/ui/badge";
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
import { placements } from "@/db/schema";
import { formatMoney } from "@/lib/ats";
import { requireTenant } from "@/lib/session";

import { PlacementEditDialog } from "./placement-form";

export const metadata = { title: "Placements" };

const statusVariant = {
  active: "default",
  pending_start: "secondary",
  completed: "outline",
  terminated: "destructive",
} as const;

export default async function PlacementsPage() {
  const { organizationId } = await requireTenant();

  const rows = await db.query.placements.findMany({
    where: eq(placements.organizationId, organizationId),
    orderBy: [desc(placements.createdAt)],
    with: {
      candidate: { columns: { name: true } },
      job: { columns: { title: true }, with: { clientCompany: { columns: { name: true } } } },
      recruiter: { columns: { name: true } },
    },
  });

  const totalFees = rows
    .filter((row) => row.status !== "terminated")
    .reduce((sum, row) => sum + (row.fee ?? 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Placements</h2>
        <p className="text-muted-foreground text-sm">
          {rows.length} total · {formatMoney(totalFees, "GBP")} in fees (excl. terminated)
        </p>
      </div>

      <Card>
        <CardContent className="pt-2">
          {rows.length === 0 ? (
            <p className="text-muted-foreground py-16 text-center text-sm">
              No placements yet — move a candidate to the Placed stage in the pipeline.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Recruiter</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>Fee</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.candidate.name}</TableCell>
                    <TableCell>{row.job.title}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.job.clientCompany?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.recruiter?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.startDate
                        ? row.startDate.toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {formatMoney(row.fee, row.feeCurrency)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[row.status]}>
                        {row.status.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <PlacementEditDialog
                        placement={{
                          id: row.id,
                          status: row.status,
                          startDate: row.startDate,
                          salary: row.salary,
                          fee: row.fee,
                          candidateName: row.candidate.name,
                        }}
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
