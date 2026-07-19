import type { Metadata } from "next";

import { JobCard } from "@/components/marketing/cards";
import { CtaBanner, PageHero, Section } from "@/components/marketing/section";
import { getPublicJobs } from "@/server/public-jobs";

export const metadata: Metadata = {
  title: "Jobs",
  description:
    "Live UK roles for South African professionals — remote-first, GBP salaries, permanent and contract.",
};

// Live board: always reflect the ATS without a rebuild.
export const dynamic = "force-dynamic";

/** Public job board, driven by published open jobs in the ATS. */
export default async function BrowseJobsPage() {
  const liveJobs = await getPublicJobs();

  return (
    <>
      <PageHero
        eyebrow="Jobs"
        title="Live roles"
        description="Every role listed is actively hiring, with a named consultant behind it. Salaries shown are real ranges, not bait."
      />
      <Section>
        {liveJobs.length === 0 ? (
          <p className="text-muted-foreground py-12 text-center">
            No open roles right now — register your CV and we&apos;ll match you as new roles
            open.
          </p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {liveJobs.map((job) => (
              <JobCard key={job.slug} job={job} />
            ))}
          </div>
        )}
      </Section>
      <CtaBanner
        title="Nothing that fits today?"
        description="Register your CV — matching runs continuously as new roles open."
      />
    </>
  );
}
