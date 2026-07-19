"use client";

import { MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { PlanId } from "@/lib/plans";
import { adminChangePlan, adminGrantCredits } from "@/server/admin-actions";

export function TenantActions({
  organizationId,
  tenantName,
  currentPlan,
}: {
  organizationId: string;
  tenantName: string;
  currentPlan: PlanId;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function changePlan(plan: PlanId) {
    setBusy(true);
    const result = await adminChangePlan({ organizationId, plan });
    setBusy(false);
    toast[result.ok ? "success" : "error"](
      result.ok ? `${tenantName} moved to ${plan}` : result.error,
    );
    if (result.ok) router.refresh();
  }

  async function grantCredits() {
    setBusy(true);
    const result = await adminGrantCredits({ organizationId, credits: 100 });
    setBusy(false);
    toast[result.ok ? "success" : "error"](
      result.ok ? `Granted 100 credits to ${tenantName}` : result.error,
    );
    if (result.ok) router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={busy} aria-label={`Manage ${tenantName}`}>
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Change plan</DropdownMenuLabel>
        {(["starter", "professional", "enterprise"] as const).map((plan) => (
          <DropdownMenuItem key={plan} disabled={plan === currentPlan} onClick={() => changePlan(plan)}>
            {plan}
            {plan === currentPlan ? " (current)" : ""}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={grantCredits}>Grant 100 AI credits</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
