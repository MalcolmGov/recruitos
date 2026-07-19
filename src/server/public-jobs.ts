import "server-only";

import { and, desc, eq } from "drizzle-orm";

import type { Job } from "@/content/site";
import { db } from "@/db";
import { jobs } from "@/db/schema";
import { formatSalaryRange } from "@/lib/ats";

const workModeLabels = { remote: "Remote", hybrid: "Hybrid", onsite: "Onsite" } as const;

/** Published open ATS jobs mapped to the public JobCard contract. */
export async function getPublicJobs(limit?: number): Promise<Job[]> {
  const rows = await db.query.jobs.findMany({
    where: and(eq(jobs.published, true), eq(jobs.status, "open")),
    orderBy: [desc(jobs.updatedAt)],
    limit,
  });

  return rows.map((row) => ({
    slug: row.id,
    title: row.title,
    type: row.type === "contract" ? ("Contract" as const) : ("Permanent" as const),
    location: row.location ?? "Remote (UK client)",
    workMode: workModeLabels[row.workMode],
    salary:
      row.type === "contract"
        ? `${formatSalaryRange(row.salaryMin, row.salaryMax, row.currency)}/day`
        : formatSalaryRange(row.salaryMin, row.salaryMax, row.currency),
    summary: row.description ?? "",
    tags: row.tags,
  }));
}
