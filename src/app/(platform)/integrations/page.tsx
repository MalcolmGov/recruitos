import { eq } from "drizzle-orm";

import { db } from "@/db";
import { tenantIntegrations } from "@/db/schema";
import { requireTenant } from "@/lib/session";

import { IntegrationsCatalog } from "./catalog-client";

export const metadata = { title: "Integrations" };

export default async function IntegrationsPage() {
  const { organizationId } = await requireTenant();

  const connected = await db.query.tenantIntegrations.findMany({
    where: eq(tenantIntegrations.organizationId, organizationId),
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Integrations</h2>
        <p className="text-muted-foreground text-sm">
          Connect RecruitOS to the tools around your desk. Each tenant connects its own
          accounts.
        </p>
      </div>

      <IntegrationsCatalog
        connected={connected.map((row) => ({
          type: row.type,
          enabled: row.enabled,
          config: row.config,
        }))}
      />
    </div>
  );
}
