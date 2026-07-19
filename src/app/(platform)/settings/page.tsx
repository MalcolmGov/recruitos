import { eq } from "drizzle-orm";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db } from "@/db";
import { invitation, member, organization, tenantSettings } from "@/db/schema";
import { requireTenant } from "@/lib/session";

import { ProfileForm } from "./profile-form";
import { TeamPanel } from "./team-panel";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { organizationId } = await requireTenant();

  const [org, settings, members, invitations] = await Promise.all([
    db.query.organization.findFirst({ where: eq(organization.id, organizationId) }),
    db.query.tenantSettings.findFirst({
      where: eq(tenantSettings.organizationId, organizationId),
    }),
    db.query.member.findMany({
      where: eq(member.organizationId, organizationId),
      with: { user: { columns: { name: true, email: true } } },
    }),
    db.query.invitation.findMany({
      where: eq(invitation.organizationId, organizationId),
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Settings</h2>
        <p className="text-muted-foreground text-sm">
          Tenant profile, team and connected services.
        </p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <ProfileForm
            initial={{
              name: org?.name ?? "",
              timezone: settings?.timezone ?? "Africa/Johannesburg",
              clientCurrency: settings?.clientCurrency ?? "GBP",
              internalCurrency: settings?.internalCurrency ?? "ZAR",
            }}
          />
        </TabsContent>

        <TabsContent value="team" className="mt-4">
          <TeamPanel
            members={members.map((row) => ({
              id: row.id,
              role: row.role,
              name: row.user.name,
              email: row.user.email,
            }))}
            invitations={invitations
              .filter((row) => row.status === "pending")
              .map((row) => ({ id: row.id, email: row.email, role: row.role ?? "recruiter" }))}
          />
        </TabsContent>

      </Tabs>
    </div>
  );
}
