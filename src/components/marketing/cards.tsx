import { ArrowRight, MapPin, Quote } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Article, CaseStudy, Job } from "@/content/site";

export function JobCard({ job }: { job: Job }) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-base">{job.title}</CardTitle>
          <Badge variant={job.type === "Contract" ? "outline" : "secondary"}>{job.type}</Badge>
        </div>
        <p className="text-muted-foreground flex items-center gap-1 text-sm">
          <MapPin className="size-3.5" />
          {job.location} · {job.workMode}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-muted-foreground text-sm">{job.summary}</p>
        <div className="flex flex-wrap items-center gap-1.5">
          {job.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="font-normal">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="flex items-center justify-between pt-1">
          <span className="font-mono text-sm font-medium">{job.salary}</span>
          <Link
            href="/contact"
            className="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline"
          >
            Apply <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export function ArticleCard({ article }: { article: Article }) {
  return (
    <Card className="flex flex-col transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          <Badge variant="secondary">{article.category}</Badge>
          <time dateTime={article.date}>
            {new Date(article.date).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </time>
        </div>
        <CardTitle className="text-base leading-snug">
          <Link href={`/blog/${article.slug}`} className="hover:underline">
            {article.title}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-between gap-4">
        <p className="text-muted-foreground text-sm">{article.excerpt}</p>
        <Link
          href={`/blog/${article.slug}`}
          className="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline"
        >
          Read article <ArrowRight className="size-3.5" />
        </Link>
      </CardContent>
    </Card>
  );
}

export function CaseStudyCard({ study }: { study: CaseStudy }) {
  return (
    <Card className="flex flex-col transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{study.industry}</Badge>
          <span className="text-muted-foreground text-xs">{study.client}</span>
        </div>
        <CardTitle className="text-base leading-snug">
          <Link href={`/case-studies/${study.slug}`} className="hover:underline">
            {study.title}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-between gap-4">
        <p className="text-muted-foreground text-sm">{study.challenge}</p>
        <Link
          href={`/case-studies/${study.slug}`}
          className="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline"
        >
          Read case study <ArrowRight className="size-3.5" />
        </Link>
      </CardContent>
    </Card>
  );
}

export function TestimonialCard({
  quote,
  name,
  role,
}: {
  quote: string;
  name: string;
  role: string;
}) {
  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <Quote className="text-primary size-5" />
        <p className="text-sm leading-relaxed">{quote}</p>
        <div>
          <p className="text-sm font-semibold">{name}</p>
          <p className="text-muted-foreground text-xs">{role}</p>
        </div>
      </CardContent>
    </Card>
  );
}
