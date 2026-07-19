import type { Metadata } from "next";

import { JobCard } from "@/components/marketing/cards";
import { CtaBanner, PageHero, Section } from "@/components/marketing/section";
import { jobs } from "@/content/site";

export const metadata: Metadata = {
  title: "Jobs",
  description:
    "Live UK roles for South African professionals — remote-first, GBP salaries, permanent and contract.",
};

/**
 * Public job board. Currently content-driven; Phase 3 wires this to live
 * tenant jobs published from the ATS (same card contract).
 */
export default function BrowseJobsPage() {
  return (
    <>
      <PageHero
        eyebrow="Jobs"
        title="Live roles"
        description="Every role listed is actively hiring, with a named consultant behind it. Salaries shown are real ranges, not bait."
      />
      <Section>
        <div className="grid gap-6 md:grid-cols-2">
          {jobs.map((job) => (
            <JobCard key={job.slug} job={job} />
          ))}
        </div>
      </Section>
      <CtaBanner
        title="Nothing that fits today?"
        description="Register your CV — matching runs continuously as new roles open."
      />
    </>
  );
}
