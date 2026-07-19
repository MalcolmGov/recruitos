import type { Metadata } from "next";

import { CtaBanner, PageHero, Section, SectionHeader } from "@/components/marketing/section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { stats } from "@/content/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "Meridian Talent Partners connects UK employers with exceptional South African talent, powered by the RecruitOS platform.",
};

const values = [
  {
    title: "Judgement over volume",
    description:
      "We'd rather send you three right candidates than thirty CVs. Every shortlist is argued for, not forwarded.",
  },
  {
    title: "Both sides of the table",
    description:
      "Candidates get the same honesty, preparation and feedback as clients. Great hires come from respected candidates.",
  },
  {
    title: "Compliance without friction",
    description:
      "Right-to-work, IR35, GDPR and POPIA are engineered into our platform — not bolted on at the end.",
  },
  {
    title: "Technology with a human in charge",
    description:
      "AI ranks, explains and accelerates. People decide. That order never reverses.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About us"
        title="Built on a simple observation"
        description="The UK has a talent shortage. South Africa has world-class professionals in the same time zone. Somebody needed to build the bridge properly."
      />
      <Section>
        <div className="mx-auto max-w-3xl space-y-6 text-lg leading-relaxed">
          <p>
            Meridian Talent Partners was founded to do cross-border recruitment the right way —
            not as outsourcing, but as genuine team-building. Our consultants sit in
            Johannesburg and Cape Town; our clients are across the UK; our candidates work as
            first-class members of the teams they join.
          </p>
          <p className="text-muted-foreground">
            We built our own recruitment operating system, RecruitOS, because no off-the-shelf
            ATS handled what cross-border hiring actually requires: dual-currency commercial
            models, UK right-to-work verification, IR35 support and time-zone-aware scheduling
            in one place. That platform now powers every search we run.
          </p>
        </div>
      </Section>
      <Section muted className="border-y">
        <div className="grid gap-8 text-center sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-primary font-mono text-4xl font-semibold">{stat.value}</p>
              <p className="text-muted-foreground mt-1 text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </Section>
      <Section>
        <SectionHeader eyebrow="Values" title="How we work" />
        <div className="grid gap-6 md:grid-cols-2">
          {values.map((value) => (
            <Card key={value.title}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{value.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">{value.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>
      <CtaBanner />
    </>
  );
}
