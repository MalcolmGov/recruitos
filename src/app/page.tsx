import { ArrowRight, Flame } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

/**
 * Interim landing page. The full CMS-driven corporate website (18 pages,
 * per-tenant white-labeling) is Phase 2 — this exists so the root route is a
 * designed surface rather than a template default.
 */
export default function HomePage() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex h-16 items-center justify-between border-b px-6 lg:px-10">
        <div className="flex items-center gap-2 font-semibold">
          <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
            <Flame className="size-4" />
          </span>
          RecruitOS
        </div>
        <nav className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/sign-up">Get started</Link>
          </Button>
        </nav>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
        <span className="border-primary/30 text-primary rounded-full border px-3 py-1 text-xs font-medium">
          Multi-tenant recruitment operating system
        </span>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
          Run your entire recruitment business on one platform
        </h1>
        <p className="text-muted-foreground max-w-xl text-lg text-balance">
          ATS, CRM, AI recruiter and client portals — white-labeled for your agency, built
          for cross-border hiring between South Africa and the UK.
        </p>
        <div className="flex gap-3">
          <Button size="lg" asChild>
            <Link href="/sign-up">
              Create your workspace
              <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/sign-in">Sign in</Link>
          </Button>
        </div>
      </main>
      <footer className="text-muted-foreground border-t px-6 py-4 text-center text-xs">
        RecruitOS — a Move Digital platform
      </footer>
    </div>
  );
}
