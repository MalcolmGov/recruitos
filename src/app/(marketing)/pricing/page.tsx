import { Check } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { CtaBanner, PageHero, Section } from "@/components/marketing/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { pricingTiers } from "@/content/site";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Transparent recruitment pricing: contingent, priority and embedded models. Pay on success — no retainers for standard roles.",
};

export default function PricingPage() {
  return (
    <>
      <PageHero
        eyebrow="Pricing"
        title="Simple, success-based pricing"
        description="No retainers for standard roles. No exclusivity demands. You pay when your hire starts."
      />
      <Section>
        <div className="grid gap-6 lg:grid-cols-3">
          {pricingTiers.map((tier) => (
            <Card
              key={tier.name}
              className={cn(tier.highlighted && "border-primary relative shadow-md")}
            >
              {tier.highlighted ? (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Most popular</Badge>
              ) : null}
              <CardHeader>
                <CardTitle className="text-base">{tier.name}</CardTitle>
                <div className="mt-2">
                  <span className="font-mono text-4xl font-semibold">{tier.price}</span>
                  <span className="text-muted-foreground ml-2 text-sm">{tier.unit}</span>
                </div>
                <p className="text-muted-foreground mt-2 text-sm">{tier.description}</p>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <ul className="space-y-2.5">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="text-primary mt-0.5 size-4 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button variant={tier.highlighted ? "default" : "outline"} asChild>
                  <Link href="/contact">{tier.cta}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="text-muted-foreground mt-8 text-center text-sm">
          Contract placements are priced as a margin on day rate, quoted per role. Executive
          search is a retained engagement quoted per brief.
        </p>
      </Section>
      <CtaBanner
        title="Want a precise quote?"
        description="Share the role and salary band — we'll confirm the fee in writing the same day."
      />
    </>
  );
}
