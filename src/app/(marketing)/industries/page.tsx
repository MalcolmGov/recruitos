import type { Metadata } from "next";

import { IndustryCard } from "@/components/marketing/cards";
import { CtaBanner, PageHero, Section } from "@/components/marketing/section";
import { industries } from "@/content/site";

export const metadata: Metadata = {
  title: "Industries",
  description:
    "Specialist recruitment desks: technology, finance, healthcare, legal, sales and creative talent from South Africa for UK employers.",
};

export default function IndustriesPage() {
  return (
    <>
      <PageHero
        eyebrow="Industries"
        title="Specialists on every desk"
        description="Our consultants recruit in the markets they came from — they know the titles, the tooling, the salary bands and the people."
      />
      <Section>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {industries.map((industry) => (
            <IndustryCard key={industry.title} industry={industry} />
          ))}
        </div>
      </Section>
      <CtaBanner
        title="Don't see your sector?"
        description="Our international desk runs bespoke briefs across markets — start a conversation."
      />
    </>
  );
}
