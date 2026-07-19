import { Users } from "lucide-react";

import { ModulePlaceholder } from "@/components/module-placeholder";
import { requireTenant } from "@/lib/session";

export const metadata = { title: "Candidates" };

export default async function CandidatesPage() {
  await requireTenant();
  return (
    <ModulePlaceholder
      icon={Users}
      title="Candidates"
      description="Searchable talent database with AI CV parsing, matching and compliance tracking."
      phase="Phase 3"
    />
  );
}
