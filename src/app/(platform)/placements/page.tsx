import { Handshake } from "lucide-react";

import { ModulePlaceholder } from "@/components/module-placeholder";
import { requireTenant } from "@/lib/session";

export const metadata = { title: "Placements" };

export default async function PlacementsPage() {
  await requireTenant();
  return (
    <ModulePlaceholder
      icon={Handshake}
      title="Placements"
      description="Track offers through to placement with commission calculation per recruiter."
      phase="Phase 3"
    />
  );
}
