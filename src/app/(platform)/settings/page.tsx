import { Settings } from "lucide-react";

import { ModulePlaceholder } from "@/components/module-placeholder";
import { requireTenant } from "@/lib/session";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  await requireTenant();
  return (
    <ModulePlaceholder
      icon={Settings}
      title="Settings"
      description="Tenant branding, currencies, modules, team and billing configuration."
      phase="Phase 2"
    />
  );
}
