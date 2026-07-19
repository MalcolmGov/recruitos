import type { Metadata } from "next";
import Link from "next/link";

import { ServiceCard } from "@/components/marketing/cards";
import { CtaBanner, PageHero, Section } from "@/components/marketing/section";
import { Button } from "@/components/ui/button";
import { services } from "@/content/site";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Permanent recruitment, contract placement, executive search and international hiring — SA talent for UK teams.",
};

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Services"
        title="One partner for every kind of hire"
        description="Each service runs on the same platform: AI-assisted sourcing, human vetting, transparent tracking and built-in compliance."
      >
        <Button size="lg" asChild>
          <Link href="/contact">Discuss your needs</Link>
        </Button>
      </PageHero>
      <Section>
        <div className="grid gap-6 md:grid-cols-2">
          {services.map((service) => (
            <ServiceCard
              key={service.slug}
              id={service.slug}
              service={service}
              className="scroll-mt-24"
            />
          ))}
        </div>
      </Section>
      <CtaBanner
        title="Not sure which service fits?"
        description="Tell us the problem — we'll recommend the shape of the engagement, with pricing upfront."
      />
    </>
  );
}
