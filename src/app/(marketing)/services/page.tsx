import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { CtaBanner, PageHero, Section } from "@/components/marketing/section";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
            <Card key={service.slug} id={service.slug} className="scroll-mt-24">
              <CardHeader>
                <CardTitle className="text-xl">{service.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">{service.description}</p>
                <ul className="space-y-2">
                  {service.points.map((point) => (
                    <li key={point} className="flex items-start gap-2 text-sm">
                      <ArrowRight className="text-primary mt-0.5 size-3.5 shrink-0" />
                      {point}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
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
