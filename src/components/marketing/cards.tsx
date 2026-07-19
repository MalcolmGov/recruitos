import {
  ArrowRight,
  Check,
  Cpu,
  Crown,
  FileClock,
  Globe2,
  HeartPulse,
  Landmark,
  LineChart,
  MapPin,
  Palette,
  Quote,
  Scale,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import type { Article, CaseStudy, Job } from "@/content/site";
import { cn } from "@/lib/utils";

/**
 * Marketing card language: one premium base (lift, glow, gradient hairline)
 * shared by every card so the whole site moves together.
 */

export function PremiumCard({
  children,
  className,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <div
      id={id}
      className={cn(
        "group bg-card hover:border-primary/30 relative flex flex-col overflow-hidden rounded-2xl border p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-lg",
        className,
      )}
    >
      <div className="gradient-primary absolute inset-x-0 top-0 h-0.5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="bg-primary/10 pointer-events-none absolute -top-16 -right-16 size-44 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />
      <div className="relative flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}

export function IconTile({
  icon: Icon,
  variant = "tint",
  className,
}: {
  icon: LucideIcon;
  variant?: "tint" | "gradient" | "ai";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110",
        variant === "gradient" && "gradient-primary text-white shadow-sm",
        variant === "ai" && "gradient-ai text-white shadow-sm",
        variant === "tint" && "bg-primary/10 text-primary",
        className,
      )}
    >
      <Icon className="size-5" />
    </span>
  );
}

// ------------------------------------------------------------- services ---

const SERVICE_ICONS: Record<string, LucideIcon> = {
  permanent: Users,
  contract: FileClock,
  executive: Crown,
  international: Globe2,
};

export function ServiceCard({
  service,
  id,
  className,
}: {
  service: {
    slug: string;
    title: string;
    description: string;
    points: readonly string[];
  };
  id?: string;
  className?: string;
}) {
  return (
    <PremiumCard id={id} className={className}>
      <div className="flex items-center gap-3">
        <IconTile icon={SERVICE_ICONS[service.slug] ?? Users} variant="gradient" />
        <h3 className="text-lg font-semibold tracking-tight">{service.title}</h3>
      </div>
      <p className="text-muted-foreground mt-4 text-sm leading-relaxed">{service.description}</p>
      <ul className="mt-5 space-y-2.5">
        {service.points.map((point) => (
          <li key={point} className="flex items-start gap-2.5 text-sm">
            <span className="bg-primary/10 text-primary mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-full">
              <Check className="size-3" />
            </span>
            {point}
          </li>
        ))}
      </ul>
    </PremiumCard>
  );
}

// ----------------------------------------------------------- industries ---

const INDUSTRY_ICONS: Record<string, LucideIcon> = {
  "Technology & Engineering": Cpu,
  "Finance & Fintech": Landmark,
  Healthcare: HeartPulse,
  "Legal & Professional Services": Scale,
  "Sales & Customer Success": LineChart,
  "Creative & Marketing": Palette,
};

export function IndustryCard({
  industry,
}: {
  industry: { title: string; description: string };
}) {
  return (
    <PremiumCard>
      <IconTile icon={INDUSTRY_ICONS[industry.title] ?? Cpu} />
      <h3 className="mt-4 font-semibold tracking-tight">{industry.title}</h3>
      <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{industry.description}</p>
    </PremiumCard>
  );
}

// -------------------------------------------------------------- process ---

export function ProcessStepCard({
  item,
}: {
  item: { step: string; title: string; description: string };
}) {
  return (
    <PremiumCard>
      <div className="flex items-baseline gap-3">
        <span className="text-gradient-primary font-mono text-3xl font-bold tabular-nums">
          {item.step}
        </span>
        <h3 className="font-semibold tracking-tight">{item.title}</h3>
      </div>
      <p className="text-muted-foreground mt-3 text-sm leading-relaxed">{item.description}</p>
    </PremiumCard>
  );
}

// ------------------------------------------------------------- features ---

export function FeatureTile({
  feature,
}: {
  feature: { title: string; description: string; icon: LucideIcon };
}) {
  return (
    <PremiumCard>
      <IconTile icon={feature.icon} variant="ai" />
      <h3 className="mt-4 font-semibold tracking-tight">{feature.title}</h3>
      <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{feature.description}</p>
    </PremiumCard>
  );
}

// ----------------------------------------------------------------- jobs ---

export function JobCard({ job }: { job: Job }) {
  return (
    <PremiumCard>
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold tracking-tight">{job.title}</h3>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
            job.type === "Contract"
              ? "bg-warning/15 text-[oklch(0.55_0.14_70)] dark:text-warning"
              : "bg-primary/10 text-primary",
          )}
        >
          {job.type}
        </span>
      </div>
      <p className="text-muted-foreground mt-1.5 flex items-center gap-1 text-sm">
        <MapPin className="size-3.5" />
        {job.location} · {job.workMode}
      </p>
      <p className="text-muted-foreground mt-4 text-sm leading-relaxed">{job.summary}</p>
      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        {job.tags.map((tag) => (
          <span
            key={tag}
            className="bg-secondary text-secondary-foreground rounded-full px-2.5 py-0.5 text-xs"
          >
            {tag}
          </span>
        ))}
      </div>
      <div className="mt-auto flex items-center justify-between pt-5">
        <span className="font-mono text-base font-semibold tabular-nums">{job.salary}</span>
        <Link
          href="/contact"
          className="text-primary inline-flex items-center gap-1 text-sm font-medium"
        >
          Apply
          <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </div>
    </PremiumCard>
  );
}

// ------------------------------------------------------------- articles ---

export function ArticleCard({ article }: { article: Article }) {
  return (
    <PremiumCard>
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
      <h3 className="mt-3 text-base leading-snug font-semibold tracking-tight">
        <Link href={`/blog/${article.slug}`} className="hover:text-primary transition-colors">
          {article.title}
        </Link>
      </h3>
      <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{article.excerpt}</p>
      <Link
        href={`/blog/${article.slug}`}
        className="text-primary mt-auto inline-flex items-center gap-1 pt-4 text-sm font-medium"
      >
        Read article
        <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1" />
      </Link>
    </PremiumCard>
  );
}

export function CaseStudyCard({ study }: { study: CaseStudy }) {
  return (
    <PremiumCard>
      <div className="flex items-center gap-2">
        <Badge variant="secondary">{study.industry}</Badge>
        <span className="text-muted-foreground text-xs">{study.client}</span>
      </div>
      <h3 className="mt-3 text-base leading-snug font-semibold tracking-tight">
        <Link
          href={`/case-studies/${study.slug}`}
          className="hover:text-primary transition-colors"
        >
          {study.title}
        </Link>
      </h3>
      <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{study.challenge}</p>
      <Link
        href={`/case-studies/${study.slug}`}
        className="text-primary mt-auto inline-flex items-center gap-1 pt-4 text-sm font-medium"
      >
        Read case study
        <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1" />
      </Link>
    </PremiumCard>
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
    <PremiumCard>
      <span className="gradient-primary flex size-8 items-center justify-center rounded-lg text-white">
        <Quote className="size-4" />
      </span>
      <p className="mt-4 text-sm leading-relaxed">{quote}</p>
      <div className="mt-auto pt-4">
        <p className="text-sm font-semibold">{name}</p>
        <p className="text-muted-foreground text-xs">{role}</p>
      </div>
    </PremiumCard>
  );
}
