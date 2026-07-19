import { Briefcase } from "lucide-react";

import { ModulePlaceholder } from "@/components/module-placeholder";
import { requireTenant } from "@/lib/session";

export const metadata = { title: "Jobs" };

export default async function JobsPage() {
  await requireTenant();
  return (
    <ModulePlaceholder
      icon={Briefcase}
      title="Jobs"
      description="Create roles, manage approvals and hiring workflows, and publish to job boards."
      phase="Phase 3"
    />
  );
}
