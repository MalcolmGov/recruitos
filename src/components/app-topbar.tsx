"use client";

import { usePathname } from "next/navigation";

import { CommandPalette } from "@/components/command-palette";
import { ThemeToggle } from "@/components/theme-toggle";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { navigation } from "@/lib/navigation";

export function AppTopbar() {
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
        <ThemeToggle />
      </div>
    </header>
  );
}
