import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type ModulePlaceholderProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  phase: string;
};

/**
 * Designed empty state for modules whose functionality lands in a later phase.
 * Routes, navigation, RBAC gating and licensing are already real — only the
 * module body is pending.
 */
export function ModulePlaceholder({
  icon: Icon,
  title,
  description,
  phase,
}: ModulePlaceholderProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <div className="bg-accent text-accent-foreground flex size-14 items-center justify-center rounded-2xl">
          <Icon className="size-7" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-muted-foreground mx-auto max-w-md text-sm">{description}</p>
        </div>
        <Badge variant="secondary">Arriving in {phase}</Badge>
      </CardContent>
    </Card>
  );
}
