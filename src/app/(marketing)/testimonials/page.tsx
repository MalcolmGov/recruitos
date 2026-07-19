import type { Metadata } from "next";

import { TestimonialCard } from "@/components/marketing/cards";
import { CtaBanner, PageHero, Section } from "@/components/marketing/section";
import { testimonials } from "@/content/site";

export const metadata: Metadata = {
  title: "Testimonials",
  description: "What UK clients and placed candidates say about working with Meridian Talent Partners.",
};

export default function TestimonialsPage() {
  return (
    <>
      <PageHero
        eyebrow="Testimonials"
        title="On the record"
        description="Clients and candidates, in their own words."
      />
      <Section>
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
