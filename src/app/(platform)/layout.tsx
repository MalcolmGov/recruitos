import { eq } from "drizzle-orm";

import { AppSidebar } from "@/components/app-sidebar";
import { AppTopbar } from "@/components/app-topbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { db } from "@/db";
import { organization } from "@/db/schema";
import { requireTenant } from "@/lib/session";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, organizationId } = await requireTenant();

  const tenant = await db.query.organization.findFirst({
    where: eq(organization.id, organizationId),
    columns: { name: true },
  });

  return (
    <SidebarProvider>
      <AppSidebar
        tenantName={tenant?.name ?? "Workspace"}
        user={{ name: session.user.name, email: session.user.email }}
      />
      <SidebarInset>
        <AppTopbar />
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
