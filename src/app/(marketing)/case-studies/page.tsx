import type { Metadata } from "next";

import { CaseStudyCard } from "@/components/marketing/cards";
import { CtaBanner, PageHero, Section } from "@/components/marketing/section";
import { caseStudies } from "@/content/site";

export const metadata: Metadata = {
  title: "Case Studies",
  description:
    "Real hiring outcomes: engineering pods, finance functions and contractor squads delivered for UK clients.",
};

export default function CaseStudiesPage() {
  return (
    <>
      <PageHero
        eyebrow="Case studies"
        title="Outcomes, not activity"
        description="Three engagements that show how the model works in practice — with numbers."
      />
      <Section>
        <div className="grid gap-6 lg:grid-cols-3">
          {caseStudies.map((study) => (
            <CaseStudyCard key={study.slug} study={study} />
          ))}
        </div>
      </Section>
      <CtaBanner />
    </>
  );
}
