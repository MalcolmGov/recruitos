import { ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { requirePlatformAdmin } from "@/lib/platform-admin";

import { AdminNav } from "./admin-nav";

/**
 * Platform console shell — the operator (Move Digital) surface, deliberately
 * distinct from the tenant workspace: no tenant sidebar, violet operator
 * accent, cross-tenant data.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requirePlatformAdmin();

  return (
    <div className="flex min-h-svh flex-col">
      <header className="bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
        <div className="mx-auto flex h-14 max-w-(--breakpoint-2xl) items-center justify-between px-6 lg:px-10">
          <div className="flex items-center gap-3">
            <span className="gradient-ai flex size-8 items-center justify-center rounded-lg text-white">
              <ShieldCheck className="size-4" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold">RecruitOS Platform Console</p>
              <p className="text-muted-foreground text-xs">
                Operator view · {session.user.email}
              </p>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm transition-colors"
          >
            <ArrowLeft className="size-4" /> Back to workspace
          </Link>
        </div>
        <div className="mx-auto max-w-(--breakpoint-2xl) px-6 lg:px-10">
          <AdminNav />
        </div>
      </header>
      <main className="mx-auto w-full max-w-(--breakpoint-2xl) flex-1 px-6 py-8 lg:px-10">{children}</main>
    </div>
  );
}
