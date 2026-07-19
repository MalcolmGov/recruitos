import { ArrowRight, BookOpen, FileText, HelpCircle, Newspaper } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ArticleCard } from "@/components/marketing/cards";
import { CtaBanner, PageHero, Section, SectionHeader } from "@/components/marketing/section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { articles } from "@/content/site";

export const metadata: Metadata = {
  title: "Resources",
  description:
    "Guides, articles, case studies and answers for UK employers and South African candidates.",
};

const hubs = [
  {
    icon: Newspaper,
    title: "Blog",
    description: "Market insights, compliance guides and recruitment-technology commentary.",
    href: "/blog",
  },
  {
    icon: FileText,
    title: "Case studies",
    description: "Real engagements with real numbers — how the model performs in practice.",
    href: "/case-studies",
  },
  {
    icon: HelpCircle,
    title: "FAQ",
    description: "Straight answers on legal structures, time zones, pricing and guarantees.",
    href: "/faq",
  },
  {
    icon: BookOpen,
    title: "Live jobs",
    description: "Every role we're actively hiring for, with honest salary ranges.",
    href: "/browse-jobs",
  },
];

export default function ResourcesPage() {
  return (
    <>
      <PageHero
        eyebrow="Resources"
        title="Everything we know, written down"
        description="Whether you're building a UK team or planning a move into one, start here."
      />
      <Section>
        <div className="grid gap-6 sm:grid-cols-2">
          {hubs.map((hub) => (
            <Card key={hub.href} className="transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <hub.icon className="text-primary mb-2 size-6" />
                <CardTitle className="text-base">{hub.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground text-sm">{hub.description}</p>
                <Link
                  href={hub.href}
                  className="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline"
                >
                  Explore <ArrowRight className="size-3.5" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>
      <Section muted className="border-y">
        <SectionHeader eyebrow="Latest" title="Recent articles" />
        <div className="grid gap-6 lg:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      </Section>
      <CtaBanner />
    </>
  );
}
