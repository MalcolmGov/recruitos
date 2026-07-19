import { MapPin } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { CtaBanner, PageHero, Section, SectionHeader } from "@/components/marketing/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { careersRoles } from "@/content/site";

export const metadata: Metadata = {
  title: "Careers",
  description:
    "Join Meridian Talent Partners — recruitment careers with real tooling, real training and a UK-facing desk.",
};

export default function CareersPage() {
  return (
    <>
      <PageHero
        eyebrow="Careers"
        title="Recruit with better tools"
        description="Our consultants run UK desks from South Africa on a platform that removes the admin. If you're good with people and hungry to build, we should talk."
      >
        <Button size="lg" asChild>
          <Link href="/contact">Introduce yourself</Link>
        </Button>
      </PageHero>
      <Section>
        <SectionHeader eyebrow="Open roles" title="We're hiring" />
        <div className="mx-auto max-w-2xl space-y-4">
          {careersRoles.map((role) => (
            <Card key={role.title}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-base">{role.title}</CardTitle>
                  <Badge variant="secondary">{role.type}</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <p className="text-muted-foreground flex items-center gap-1 text-sm">
                  <MapPin className="size-3.5" />
                  {role.location}
                </p>
                <Link
                  href="/contact"
                  className="text-primary text-sm font-medium hover:underline"
                >
                  Apply
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>
      <CtaBanner
        title="No perfect match?"
        description="Exceptional recruiters always get a conversation. Tell us what you'd build here."
      />
    </>
  );
}
