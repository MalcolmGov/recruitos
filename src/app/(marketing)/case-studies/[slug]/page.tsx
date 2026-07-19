import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CtaBanner, Section } from "@/components/marketing/section";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { caseStudies } from "@/content/site";

export function generateStaticParams() {
  return caseStudies.map((study) => ({ slug: study.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const study = caseStudies.find((item) => item.slug === slug);
  if (!study) return {};
  return { title: `${study.client}: ${study.title}`, description: study.challenge };
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const study = caseStudies.find((item) => item.slug === slug);
  if (!study) notFound();

  return (
    <>
      <Section className="border-b">
        <div className="mx-auto max-w-2xl">
          <div className="mb-4 flex items-center gap-3">
            <Badge variant="secondary">{study.industry}</Badge>
            <span className="text-muted-foreground text-sm">{study.client}</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {study.title}
          </h1>
        </div>
      </Section>
      <Section>
        <div className="mx-auto max-w-2xl space-y-8">
          <div>
            <h2 className="mb-3 text-lg font-semibold">The challenge</h2>
            <p className="text-muted-foreground leading-relaxed">{study.challenge}</p>
          </div>
          <div>
            <h2 className="mb-3 text-lg font-semibold">Our approach</h2>
            <p className="text-muted-foreground leading-relaxed">{study.approach}</p>
          </div>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Results</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {study.results.map((result) => (
                  <li key={result} className="flex items-start gap-2 text-sm">
                    <span className="text-primary font-mono font-semibold">→</span>
                    {result}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </Section>
      <CtaBanner />
    </>
  );
}
