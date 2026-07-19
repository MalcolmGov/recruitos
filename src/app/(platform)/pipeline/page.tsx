import { KanbanSquare } from "lucide-react";

import { ModulePlaceholder } from "@/components/module-placeholder";
import { requireTenant } from "@/lib/session";

export const metadata = { title: "Pipeline" };

export default async function PipelinePage() {
  await requireTenant();
  return (
    <ModulePlaceholder
      icon={KanbanSquare}
      title="Pipeline"
      description="Drag-and-drop kanban across your hiring stages with automation on every move."
      phase="Phase 3"
    />
  );
}
