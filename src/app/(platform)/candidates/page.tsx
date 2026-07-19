import { and, desc, eq, ilike, or } from "drizzle-orm";
import { Pencil } from "lucide-react";

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
import { candidates } from "@/db/schema";
import { formatMoney } from "@/lib/ats";
import { requireTenant } from "@/lib/session";

import { QuickSearch } from "@/components/quick-search";

import { CandidateFormSheet } from "./candidate-form";
import { ImportCvDialog } from "./import-cv-dialog";

export const metadata = { title: "Candidates" };

const statusVariant = {
  active: "default",
  placed: "secondary",
  do_not_contact: "destructive",
  archived: "outline",
} as const;

export default async function CandidatesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { organizationId } = await requireTenant();
  const { q } = await searchParams;

  const rows = await db.query.candidates.findMany({
    where: and(
      eq(candidates.organizationId, organizationId),
      q
        ? or(ilike(candidates.name, `%${q}%`), ilike(candidates.currentTitle, `%${q}%`))
        : undefined,
    ),
    orderBy: [desc(candidates.updatedAt)],
    with: { applications: { columns: { id: true, stage: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Candidates</h2>
          <p className="text-muted-foreground text-sm">
            {rows.length} in the talent pool ·{" "}
            {rows.filter((row) => row.status === "active").length} active
          </p>
        </div>
        <div className="flex items-center gap-2">
          <QuickSearch placeholder="Search candidates…" />
          <ImportCvDialog />
          <CandidateFormSheet />
        </div>
      </div>

      <Card>
        <CardContent className="pt-2">
          {rows.length === 0 ? (
            <p className="text-muted-foreground py-16 text-center text-sm">
              No candidates yet — add your first profile.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Skills</TableHead>
                  <TableHead>Expectation</TableHead>
                  <TableHead>Notice</TableHead>
                  <TableHead>In pipelines</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="font-medium">{row.name}</div>
                      <div className="text-muted-foreground text-xs">
                        {row.currentTitle ?? "—"} · {row.location ?? "—"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex max-w-52 flex-wrap gap-1">
                        {row.skills.slice(0, 3).map((skill) => (
                          <Badge key={skill} variant="outline" className="font-normal">
                            {skill}
                          </Badge>
                        ))}
                        {row.skills.length > 3 ? (
                          <span className="text-muted-foreground text-xs">
                            +{row.skills.length - 3}
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {formatMoney(row.salaryExpectation, row.currency)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.noticePeriod ?? "—"}
                    </TableCell>
                    <TableCell>
                      {row.applications.filter((a) => a.stage !== "rejected").length}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[row.status]}>
                        {row.status.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <CandidateFormSheet
                        initial={row}
                        trigger={
                          <Button variant="ghost" size="icon" aria-label={`Edit ${row.name}`}>
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
