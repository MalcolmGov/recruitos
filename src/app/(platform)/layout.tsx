import { and, count, eq, notInArray } from "drizzle-orm";

import { AppSidebar } from "@/components/app-sidebar";
import { AppTopbar } from "@/components/app-topbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { db } from "@/db";
import { applications, organization } from "@/db/schema";
import { isPlatformAdminEmail } from "@/lib/platform-admin";
import { PLANS } from "@/lib/plans";
import { requireTenant } from "@/lib/session";
import { getCreditBalance, getTenantPlan } from "@/server/billing";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, organizationId } = await requireTenant();

  const [tenant, pipelineRows, planId, credits] = await Promise.all([
    db.query.organization.findFirst({
      where: eq(organization.id, organizationId),
      columns: { name: true },
    }),
    db
      .select({ value: count() })
      .from(applications)
      .where(
        and(
          eq(applications.organizationId, organizationId),
          notInArray(applications.stage, ["placed", "rejected"]),
        ),
      ),
    getTenantPlan(organizationId),
    getCreditBalance(organizationId),
  ]);
  const plan = PLANS[planId];

  return (
    <SidebarProvider>
      <AppSidebar
        tenantName={tenant?.name ?? "Workspace"}
        user={{ name: session.user.name, email: session.user.email }}
        pipelineCount={pipelineRows[0]?.value ?? 0}
        isPlatformAdmin={isPlatformAdminEmail(session.user.email)}
        workspace={{ planName: plan.name, credits, monthlyCredits: plan.monthlyAiCredits }}
      />
      <SidebarInset>
        <AppTopbar />
        <main className="flex-1 p-6 lg:px-10">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
