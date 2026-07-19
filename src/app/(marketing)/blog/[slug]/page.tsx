import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CtaBanner, Section } from "@/components/marketing/section";
import { Badge } from "@/components/ui/badge";
import { articles } from "@/content/site";

export function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = articles.find((item) => item.slug === slug);
  if (!article) return {};
  return { title: article.title, description: article.excerpt };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = articles.find((item) => item.slug === slug);
  if (!article) notFound();

  return (
    <>
      <Section className="border-b">
        <div className="mx-auto max-w-2xl">
          <div className="text-muted-foreground mb-4 flex items-center gap-3 text-sm">
            <Badge variant="secondary">{article.category}</Badge>
            <time dateTime={article.date}>
              {new Date(article.date).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </time>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {article.title}
          </h1>
        </div>
      </Section>
      <Section>
        <div className="mx-auto max-w-2xl space-y-6 text-lg leading-relaxed">
          {article.body.map((paragraph, index) => (
            <p key={index} className={index === 0 ? "" : "text-muted-foreground"}>
              {paragraph}
            </p>
          ))}
        </div>
      </Section>
      <CtaBanner />
    </>
  );
}
