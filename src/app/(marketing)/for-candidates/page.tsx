import { CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { JobCard } from "@/components/marketing/cards";
import { CtaBanner, PageHero, Section, SectionHeader } from "@/components/marketing/section";
import { Button } from "@/components/ui/button";
import { getPublicJobs } from "@/server/public-jobs";

export const metadata: Metadata = {
  title: "For Candidates",
  description:
    "Work for UK companies from South Africa — GBP-linked salaries, remote-first roles and a recruitment process that treats you properly.",
};

const promises = [
  "Honest salary guidance in GBP and ZAR before you interview",
  "Feedback after every stage — no black holes",
  "Interview preparation with role-specific question sets",
  "Right-to-work and contracting guidance handled for you",
  "Your data protected under POPIA and GDPR, always with consent",
  "A consultant who reviews every application personally",
];

export default async function CandidatesPage() {
  const liveJobs = await getPublicJobs();
  return (
    <>
      <PageHero
        eyebrow="For candidates"
        title="Work for the UK. Live in South Africa."
        description="GBP-linked salaries, remote-first UK employers, and a process built on respect — preparation, transparency and feedback at every step."
      >
        <Button size="lg" asChild>
          <Link href="/browse-jobs">Browse live roles</Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/sign-up">Register your CV</Link>
        </Button>
      </PageHero>
      <Section>
        <SectionHeader eyebrow="Our promise" title="How we treat candidates" />
        <ul className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2">
          {promises.map((promise) => (
            <li key={promise} className="flex items-start gap-3">
              <CheckCircle2 className="text-primary mt-0.5 size-5 shrink-0" />
              <span className="text-sm">{promise}</span>
            </li>
          ))}
        </ul>
      </Section>
      <Section muted className="border-y">
        <SectionHeader eyebrow="Live roles" title="Hiring right now" />
        <div className="grid gap-6 md:grid-cols-2">
          {liveJobs.map((job) => (
            <JobCard key={job.slug} job={job} />
          ))}
        </div>
      </Section>
      <CtaBanner
        title="Don't see the right role?"
        description="Register anyway — most of our placements start with a profile in our talent pool, not a job ad."
      />
    </>
  );
}
