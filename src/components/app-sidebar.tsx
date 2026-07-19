"use client";

import { ChevronsUpDown, Flame, LogOut, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";
import { navigation } from "@/lib/navigation";

type AppSidebarProps = {
  tenantName: string;
  user: { name: string; email: string };
  pipelineCount?: number;
  isPlatformAdmin?: boolean;
  workspace?: { planName: string; credits: number; monthlyCredits: number };
};

export function AppSidebar({ tenantName, user, pipelineCount, isPlatformAdmin, workspace }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/sign-in");
    router.refresh();
  }

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Flame className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{tenantName}</span>
                  <span className="truncate text-xs text-muted-foreground">RecruitOS</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {navigation.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                      tooltip={item.title}
                      className="data-[active=true]:bg-primary/10 data-[active=true]:text-primary transition-colors data-[active=true]:font-medium"
                    >
                      <Link href={item.href}>
                        {(pathname === item.href || pathname.startsWith(`${item.href}/`)) ? (
                          <span className="gradient-primary absolute inset-y-1.5 left-0 w-0.5 rounded-full" />
                        ) : null}
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                    {item.href === "/pipeline" && pipelineCount ? (
                      <SidebarMenuBadge className="text-muted-foreground">
                        {pipelineCount}
                      </SidebarMenuBadge>
                    ) : null}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        {workspace ? (
          <div className="bg-sidebar-accent/60 mx-1 mb-1 rounded-xl border p-3 group-data-[collapsible=icon]:hidden">
            <div className="flex items-center justify-between">
              <p className="truncate text-xs font-semibold">{tenantName}</p>
              <span className="text-primary bg-primary/10 rounded-full px-1.5 py-0.5 text-[10px] font-medium">
                {workspace.planName}
              </span>
            </div>
            <div className="mt-2 space-y-1">
              <div className="text-muted-foreground flex items-center justify-between text-[11px]">
                <span>AI credits</span>
                <span className="font-mono">
                  {workspace.credits} / {workspace.monthlyCredits}
                </span>
              </div>
              <div className="bg-border h-1.5 overflow-hidden rounded-full">
                <div
                  className="gradient-primary h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min((workspace.credits / Math.max(workspace.monthlyCredits, 1)) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        ) : null}
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user.name}</span>
                    <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isPlatformAdmin ? (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Platform console
                    </Link>
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
