import { Building2 } from "lucide-react";

import { ModulePlaceholder } from "@/components/module-placeholder";
import { requireTenant } from "@/lib/session";

export const metadata = { title: "Clients" };

export default async function ClientsPage() {
  await requireTenant();
  return (
    <ModulePlaceholder
      icon={Building2}
      title="Clients"
      description="UK employer accounts with contacts, roles, SLAs and revenue history."
      phase="Phase 3"
    />
  );
}
