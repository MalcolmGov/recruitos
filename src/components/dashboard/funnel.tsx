import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FunnelTier } from "@/server/dashboard";
import { cn } from "@/lib/utils";

/**
 * Pipeline funnel — current-state counts per tier (honest snapshot, not
 * historical conversion). Sequential single-hue ramp: magnitude, not identity.
 */
const RAMP = [
  "bg-primary/25",
  "bg-primary/40",
  "bg-primary/55",
  "bg-primary/70",
  "bg-primary/85",
  "bg-primary",
] as const;

export function PipelineFunnel({
  funnel,
  total,
}: {
  funnel: FunnelTier[];
  total: number;
}) {
  const max = Math.max(...funnel.map((tier) => tier.count), 1);

  return (
    <Card className="animate-fade-up">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Pipeline funnel</CardTitle>
        <span className="text-muted-foreground border-input rounded-lg border px-2.5 py-1 text-xs">
          {total} candidate{total === 1 ? "" : "s"} · all jobs
        </span>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="text-muted-foreground py-10 text-center text-sm">
            Add candidates to a job pipeline and the funnel builds itself.
          </p>
        ) : (
          <ul className="space-y-2.5">
            {funnel.map((tier, index) => (
              <li key={tier.key} className="group flex items-center gap-3">
                <span className="text-muted-foreground w-24 shrink-0 text-right text-xs">
                  {tier.label}
                </span>
                <div className="relative h-7 flex-1">
                  <div
                    className={cn(
                      "absolute inset-y-0 left-0 rounded-md rounded-l-sm transition-all duration-500",
                      RAMP[index] ?? RAMP[RAMP.length - 1],
                      "group-hover:opacity-90",
                    )}
                    style={{ width: `${Math.max((tier.count / max) * 100, tier.count > 0 ? 6 : 0)}%` }}
                  />
                  {tier.count > 0 ? (
                    <span
                      className="text-foreground absolute inset-y-0 flex items-center pl-2 font-mono text-xs font-semibold"
                      style={{ left: `${Math.max((tier.count / max) * 100, 6)}%` }}
                    >
                      {tier.count}
                      <span className="text-muted-foreground ml-1.5 hidden font-sans font-normal group-hover:inline">
                        {Math.round(tier.share * 100)}% of pipeline
                      </span>
                    </span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
