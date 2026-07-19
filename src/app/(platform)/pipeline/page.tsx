import { and, desc, eq, inArray, notInArray } from "drizzle-orm";
import { KanbanSquare } from "lucide-react";
import Link from "next/link";

import { ModulePlaceholder } from "@/components/module-placeholder";
import { Badge } from "@/components/ui/badge";
import { db } from "@/db";
import { applications, candidates, jobs } from "@/db/schema";
import { requireTenant } from "@/lib/session";
import { cn } from "@/lib/utils";

import { PipelineBoard } from "./board";

export const metadata = { title: "Pipeline" };

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ job?: string }>;
}) {
  const { organizationId } = await requireTenant();
  const { job: jobParam } = await searchParams;

  const jobRows = await db.query.jobs.findMany({
    where: and(
      eq(jobs.organizationId, organizationId),
      inArray(jobs.status, ["open", "draft"]),
    ),
    orderBy: [desc(jobs.updatedAt)],
    columns: { id: true, title: true, status: true },
  });

  if (jobRows.length === 0) {
    return (
      <ModulePlaceholder
        icon={KanbanSquare}
        title="Pipeline"
        description="Create a job first — each job gets its own hiring pipeline across your stages."
        phase="waiting for your first job"
      />
    );
  }

  const selectedJob = jobRows.find((row) => row.id === jobParam) ?? jobRows[0];

  const boardApplications = await db.query.applications.findMany({
    where: and(
      eq(applications.organizationId, organizationId),
      eq(applications.jobId, selectedJob.id),
    ),
    columns: { id: true, stage: true, updatedAt: true },
    with: { candidate: { columns: { id: true, name: true, currentTitle: true } } },
  });

  const inPipelineIds = boardApplications.map((application) => application.candidate.id);
  const availableCandidates = await db.query.candidates.findMany({
    where: and(
      eq(candidates.organizationId, organizationId),
      eq(candidates.status, "active"),
      inPipelineIds.length > 0 ? notInArray(candidates.id, inPipelineIds) : undefined,
    ),
    columns: { id: true, name: true },
    orderBy: [candidates.name],
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Pipeline</h2>
        <p className="text-muted-foreground text-sm">
          Drag cards between stages, or use a card&apos;s menu. Dropping into Placed creates a
          placement automatically.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {jobRows.map((row) => (
          <Link
            key={row.id}
            href={`/pipeline?job=${row.id}`}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
              row.id === selectedJob.id
                ? "bg-primary text-primary-foreground border-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {row.title}
            {row.status === "draft" ? (
              <Badge variant="secondary" className="ml-2">
                draft
              </Badge>
            ) : null}
          </Link>
        ))}
      </div>

      <PipelineBoard
        jobId={selectedJob.id}
        applications={boardApplications}
        availableCandidates={availableCandidates}
      />
    </div>
  );
}
