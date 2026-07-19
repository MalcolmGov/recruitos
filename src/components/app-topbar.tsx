"use client";

import { Bell, Building2, Plus, Sparkles, UserPlus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { CommandPalette } from "@/components/command-palette";
import { CopilotSheet } from "@/components/copilot-sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { navigation } from "@/lib/navigation";

export function AppTopbar({ alertCount = 0 }: { alertCount?: number }) {
  const pathname = usePathname();
  const active = navigation
    .flatMap((group) => group.items)
    .find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));

  return (
    <header className="bg-background/80 sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b px-4 backdrop-blur">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <h1 className="text-sm font-medium">{active?.title ?? "RecruitOS"}</h1>
      <div className="ml-auto flex items-center gap-2">
        <CommandPalette />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="size-4" /> Quick action
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link href="/jobs">
                <Plus className="mr-2 size-4" /> New job
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/candidates">
                <UserPlus className="mr-2 size-4" /> New candidate
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/clients">
                <Building2 className="mr-2 size-4" /> New client
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/jobs">
                <Sparkles className="mr-2 size-4" /> Run AI matching
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="outline"
          size="icon"
          aria-label={`Notifications${alertCount > 0 ? ` (${alertCount})` : ""}`}
          asChild
        >
          <Link href="/dashboard" className="relative">
            <Bell className="size-4" />
            {alertCount > 0 ? (
              <span className="bg-destructive absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 font-mono text-[10px] font-semibold text-white">
                {alertCount > 9 ? "9+" : alertCount}
              </span>
            ) : null}
          </Link>
        </Button>
        <CopilotSheet />
        <ThemeToggle />
      </div>
    </header>
  );
}
