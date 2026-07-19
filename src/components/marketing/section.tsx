import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Section({
  className,
  muted = false,
  children,
}: {
  className?: string;
  muted?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={cn(muted && "bg-secondary/50", className)}>
      <div className="mx-auto max-w-6xl px-6 py-20">{children}</div>
    </section>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "center",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "center" | "left";
}) {
  return (
    <div className={cn("mb-12 max-w-2xl", align === "center" && "mx-auto text-center")}>
      {eyebrow ? (
        <p className="text-primary mb-3 text-sm font-semibold tracking-wide uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{title}</h2>
      {description ? (
        <p className="text-muted-foreground mt-4 text-lg text-balance">{description}</p>
      ) : null}
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <Section className="border-b">
      <div className="mx-auto max-w-3xl text-center">
        {eyebrow ? (
          <p className="text-primary mb-3 text-sm font-semibold tracking-wide uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">{title}</h1>
        {description ? (
          <p className="text-muted-foreground mt-5 text-lg text-balance">{description}</p>
        ) : null}
        {children ? <div className="mt-8 flex justify-center gap-3">{children}</div> : null}
      </div>
    </Section>
  );
}

export function CtaBanner({
  title = "Ready to build your team?",
  description = "Tell us about the role. You'll have a scored shortlist faster than you think.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <Section>
      <div className="bg-primary text-primary-foreground rounded-3xl px-8 py-16 text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{title}</h2>
        <p className="mx-auto mt-4 max-w-xl text-balance opacity-90">{description}</p>
        <div className="mt-8 flex justify-center gap-3">
          <Button size="lg" variant="secondary" asChild>
            <Link href="/contact">Start a brief</Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-primary-foreground/40 bg-transparent hover:bg-primary-foreground/10 hover:text-primary-foreground"
            asChild
          >
            <Link href="/browse-jobs">Browse jobs</Link>
          </Button>
        </div>
      </div>
    </Section>
  );
}
