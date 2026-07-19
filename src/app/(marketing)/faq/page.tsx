import type { Metadata } from "next";

import { CtaBanner, PageHero, Section } from "@/components/marketing/section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { faqs } from "@/content/site";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Common questions about hiring South African talent for UK teams: legal structures, time zones, pricing and guarantees.",
};

export default function FaqPage() {
  return (
    <>
      <PageHero
        eyebrow="FAQ"
        title="Questions we hear every week"
        description="If yours isn't here, ask us directly — we answer the same day."
      />
      <Section>
        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
          {faqs.map((faq) => (
            <Card key={faq.question}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{faq.question}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed">{faq.answer}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>
      <CtaBanner
        title="Still have questions?"
        description="A consultant — not a chatbot — will come back to you within one business day."
      />
    </>
  );
}
