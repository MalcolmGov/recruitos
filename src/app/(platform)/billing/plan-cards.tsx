"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Plan, PlanId } from "@/lib/plans";
import { cn } from "@/lib/utils";
import { changePlan, topUpCredits } from "@/server/billing-actions";

export function PlanCards({ plans, currentPlan }: { plans: Plan[]; currentPlan: PlanId }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function selectPlan(planId: PlanId) {
    setBusy(planId);
    const result = await changePlan(planId);
    setBusy(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    if (result.mode === "checkout") {
      window.location.assign(result.url);
      return;
    }
    toast.success("Plan applied (dev mode — no payment taken)");
    router.refresh();
  }

  async function handleTopUp() {
    setBusy("topup");
    const result = await topUpCredits();
    setBusy(null);
    if (!result.ok) {
      toast.error(result.error ?? "Top-up failed");
      return;
    }
    toast.success("100 credits added (dev mode)");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlan;
          return (
            <Card
              key={plan.id}
              className={cn(plan.highlighted && "border-primary", isCurrent && "bg-secondary/40")}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{plan.name}</CardTitle>
                  {isCurrent ? <Badge>Current</Badge> : null}
                </div>
                <p className="font-mono text-xl font-semibold">{plan.priceLabel}</p>
                <p className="text-muted-foreground text-sm">{plan.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-1.5 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="text-primary size-3.5" />
                    {plan.seats === null ? "Unlimited seats" : `Up to ${plan.seats} seats`}
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="text-primary size-3.5" />
                    {plan.monthlyAiCredits} AI credits / month
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="text-primary size-3.5" />
                    {plan.modules.length} modules
                  </li>
                </ul>
                <Button
                  className="w-full"
                  variant={isCurrent ? "outline" : plan.highlighted ? "default" : "outline"}
                  disabled={isCurrent || busy !== null}
                  onClick={() => selectPlan(plan.id)}
                >
                  {isCurrent ? "Current plan" : busy === plan.id ? "Applying…" : `Switch to ${plan.name}`}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <Button variant="outline" onClick={handleTopUp} disabled={busy !== null}>
        {busy === "topup" ? "Adding…" : "Top up 100 credits"}
      </Button>
    </div>
  );
}
