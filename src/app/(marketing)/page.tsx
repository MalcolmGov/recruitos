import {
  ArrowRight,
  BrainCircuit,
  FileSearch,
  Globe2,
  MessagesSquare,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

import { ArticleCard, JobCard, TestimonialCard } from "@/components/marketing/cards";
import { CtaBanner, Section, SectionHeader } from "@/components/marketing/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  articles,
  industries,
  process,
  services,
  stats,
  testimonials,
  trustedBy,
} from "@/content/site";
import { getPublicJobs } from "@/server/public-jobs";

const aiFeatures = [
  {
    icon: FileSearch,
    title: "AI CV parsing",
    description: "Every CV parsed, enriched and searchable in seconds — skills, history, salary, right-to-work.",
  },
  {
    icon: BrainCircuit,
    title: "Match scoring",
    description: "Candidates ranked on skills, experience, salary and location fit — with the reasoning explained.",
  },
  {
    icon: MessagesSquare,
    title: "Interview intelligence",
    description: "Role-specific question sets, scorecards and structured feedback for every stage.",
  },
  {
    icon: ShieldCheck,
    title: "Compliance built in",
    description: "GDPR & POPIA consent, right-to-work verification and document expiry tracking by default.",
  },
];

export default async function HomePage() {
  const liveJobs = await getPublicJobs(4);
  return (
    <>
      {/* Hero */}
      <Section className="relative overflow-hidden border-b">
        <div
          aria-hidden
          className="bg-primary/10 absolute top-0 left-1/2 -z-10 h-72 w-[42rem] -translate-x-1/2 -translate-y-1/3 rounded-full blur-3xl"
        />
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="secondary" className="mb-5">
            <Sparkles className="size-3.5" />
            AI-native recruitment, SA → UK
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
            UK-calibre talent.
            <span className="text-gradient-primary"> South African advantage.</span>
          </h1>
          <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-lg text-balance">
            We help UK companies hire exceptional South African professionals — permanent,
            contract and executive — with time-zone-aligned teams, built-in compliance and an
            AI platform that finds the right person in days, not months.
          </p>
          <div className="mt-9 flex justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/contact">
                Hire talent <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/browse-jobs">Find a job</Link>
            </Button>
          </div>
        </div>
      </Section>

      {/* Statistics */}
      <Section>
        <div className="grid gap-8 text-center sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-primary font-mono text-4xl font-semibold">{stat.value}</p>
              <p className="text-muted-foreground mt-1 text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Trusted clients */}
      <Section muted className="border-y">
        <p className="text-muted-foreground mb-8 text-center text-sm font-medium tracking-wide uppercase">
          Trusted by UK teams at
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
          {trustedBy.map((name) => (
            <span key={name} className="text-muted-foreground/70 text-lg font-semibold">
              {name}
            </span>
          ))}
        </div>
      </Section>

      {/* Services */}
      <Section>
        <SectionHeader
          eyebrow="Services"
          title="Four ways we build your team"
          description="From a single urgent contractor to a full leadership search — one partner, one platform."
        />
        <div className="grid gap-6 md:grid-cols-2">
          {services.map((service) => (
            <Card key={service.slug}>
              <CardHeader>
                <CardTitle>{service.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-sm">{service.description}</p>
                <ul className="space-y-2">
                  {service.points.map((point) => (
                    <li key={point} className="flex items-start gap-2 text-sm">
                      <ArrowRight className="text-primary mt-0.5 size-3.5 shrink-0" />
                      {point}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Button variant="outline" asChild>
            <Link href="/services">Explore all services</Link>
          </Button>
        </div>
      </Section>

      {/* Industries */}
      <Section muted className="border-y">
        <SectionHeader
          eyebrow="Industries"
          title="Deep desks, not generalists"
          description="Specialist consultants who speak your market's language."
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {industries.map((industry) => (
            <Card key={industry.title}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{industry.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">{industry.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      {/* Recruitment process */}
      <Section>
        <SectionHeader
          eyebrow="How it works"
          title="A process you can see"
          description="Six steps from brief to a protected hire — tracked live in your client portal."
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {process.map((item) => (
            <div key={item.step} className="rounded-2xl border p-6">
              <p className="text-primary font-mono text-sm font-semibold">{item.step}</p>
              <h3 className="mt-2 font-semibold">{item.title}</h3>
              <p className="text-muted-foreground mt-2 text-sm">{item.description}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* AI recruitment */}
      <Section muted className="border-y">
        <SectionHeader
          eyebrow="AI recruitment"
          title="An AI platform behind every placement"
          description="RecruitOS — our own recruitment operating system — does the heavy lifting so consultants spend their time on judgement, not admin."
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {aiFeatures.map((feature) => (
            <div key={feature.title} className="rounded-2xl border bg-card p-6">
              <feature.icon className="text-primary size-6" />
              <h3 className="mt-4 font-semibold">{feature.title}</h3>
              <p className="text-muted-foreground mt-2 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Testimonials */}
      <Section>
        <SectionHeader
          eyebrow="Testimonials"
          title="What clients and candidates say"
        />
        <div className="grid gap-6 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <TestimonialCard key={testimonial.name} {...testimonial} />
          ))}
        </div>
      </Section>

      {/* Latest jobs */}
      <Section muted className="border-y">
        <SectionHeader
          eyebrow="Latest roles"
          title="Live UK opportunities"
          description="A selection of roles we're hiring for right now."
        />
        <div className="grid gap-6 md:grid-cols-2">
          {liveJobs.map((job) => (
            <JobCard key={job.slug} job={job} />
          ))}
        </div>
        <div className="mt-8 text-center">
          <Button variant="outline" asChild>
            <Link href="/browse-jobs">
              <Globe2 className="size-4" /> Browse all jobs
            </Link>
          </Button>
        </div>
      </Section>

      {/* Latest articles */}
      <Section>
        <SectionHeader eyebrow="Insights" title="From the blog" />
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
