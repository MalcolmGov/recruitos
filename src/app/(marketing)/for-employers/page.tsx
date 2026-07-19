import { CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { TestimonialCard } from "@/components/marketing/cards";
import { CtaBanner, PageHero, Section, SectionHeader } from "@/components/marketing/section";
import { Button } from "@/components/ui/button";
import { process, testimonials } from "@/content/site";

export const metadata: Metadata = {
  title: "For Employers",
  description:
    "Hire exceptional South African talent for your UK team — time-zone aligned, compliant, and 40–60% below London benchmarks.",
};

const benefits = [
  "Time-zone aligned: SA works your business day, live",
  "40–60% cost advantage vs. London benchmarks — without underpaying",
  "Native-level business English and strong cultural alignment",
  "UK right-to-work verification and IR35 support built in",
  "Client portal: watch your shortlist and pipeline in real time",
  "Replacement guarantees on every permanent placement",
];

export default function ClientsPage() {
  return (
    <>
      <PageHero
        eyebrow="For employers"
        title="Your next great hire is two time zones away"
        description="We give UK hiring managers a rigorous, transparent route into South Africa's professional talent market."
      >
        <Button size="lg" asChild>
          <Link href="/contact">Start a brief</Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/case-studies">See the results</Link>
        </Button>
      </PageHero>
      <Section>
        <SectionHeader eyebrow="Why SA" title="The case in six lines" />
        <ul className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2">
          {benefits.map((benefit) => (
            <li key={benefit} className="flex items-start gap-3">
              <CheckCircle2 className="text-primary mt-0.5 size-5 shrink-0" />
              <span className="text-sm">{benefit}</span>
            </li>
          ))}
        </ul>
      </Section>
      <Section muted className="border-y">
        <SectionHeader eyebrow="Process" title="From brief to protected hire" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {process.map((item) => (
            <div key={item.step} className="bg-card rounded-2xl border p-6">
              <p className="text-primary font-mono text-sm font-semibold">{item.step}</p>
              <h3 className="mt-2 font-semibold">{item.title}</h3>
              <p className="text-muted-foreground mt-2 text-sm">{item.description}</p>
            </div>
          ))}
        </div>
      </Section>
      <Section>
        <SectionHeader eyebrow="Proof" title="Clients on the record" />
        <div className="grid gap-6 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <TestimonialCard key={testimonial.name} {...testimonial} />
          ))}
        </div>
      </Section>
      <CtaBanner />
    </>
  );
}
