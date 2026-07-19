import type { Metadata } from "next";

import { ArticleCard } from "@/components/marketing/cards";
import { PageHero, Section } from "@/components/marketing/section";
import { articles } from "@/content/site";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Insights on cross-border hiring, UK compliance and AI in recruitment from the Meridian team.",
};

export default function BlogPage() {
  return (
    <>
      <PageHero
        eyebrow="Blog"
        title="Insights from the desk"
        description="What we're learning about cross-border hiring, compliance and recruitment technology — written by consultants, not content farms."
      />
      <Section>
        <div className="grid gap-6 lg:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      </Section>
    </>
  );
}
