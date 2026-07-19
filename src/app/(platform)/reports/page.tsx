import { BarChart3 } from "lucide-react";

import { ModulePlaceholder } from "@/components/module-placeholder";
import { requireTenant } from "@/lib/session";

export const metadata = { title: "Reports" };

export default async function ReportsPage() {
  await requireTenant();
  return (
    <ModulePlaceholder
      icon={BarChart3}
      title="Reports"
      description="Time-to-hire, source performance, revenue and recruiter leaderboards."
      phase="Phase 3"
    />
  );
}
