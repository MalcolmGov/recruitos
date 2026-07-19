import {
  ArrowRight,
  ChartNoAxesCombined,
  CircleAlert,
  Flame,
  Gauge,
  ListTodo,
  Sparkles,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  DailyBriefing,
  Forecast,
  JobRisk,
  NextAction,
  StageVelocity,
  TickerItem,
} from "@/server/intelligence";
import { cn } from "@/lib/utils";

const gbp = (value: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);

// ------------------------------------------------------ daily briefing ---

/** Sequential single-hue ramp for funnel-ordered stage segments. */
const STAGE_RAMP_OPACITY = [0.25, 0.4, 0.55, 0.7, 0.8, 0.9, 1];

export function DailyBriefingHero({
  daily,
  greeting,
  firstName,
}: {
  daily: DailyBriefing;
  greeting: string;
  firstName: string;
}) {
  const totalStageValue = daily.valueByStage.reduce((sum, entry) => sum + entry.value, 0);

  return (
    <Card className="animate-fade-up relative overflow-hidden">
      <div className="gradient-ai absolute inset-x-0 top-0 h-0.5" />
      <div className="bg-primary/8 pointer-events-none absolute -top-24 -right-24 size-72 rounded-full blur-3xl" />
      <CardContent className="grid gap-6 px-6 lg:grid-cols-[1.25fr_1fr]">
        <div>
          <p className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.1em] uppercase">
            <Sparkles className="size-3" /> AI daily briefing · {greeting}, {firstName} 👋
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-x-8 gap-y-3">
            <div>
              <p className="text-muted-foreground text-xs">Today your desk is worth</p>
              <p className="mt-1 font-mono text-[2.75rem] leading-none font-semibold tracking-tight tabular-nums">
                {gbp(daily.deskValue)}
              </p>
            </div>
            <div className="pb-1">
              <p className="text-muted-foreground text-xs">Expected (stage-weighted)</p>
              <p className="font-mono text-xl leading-tight font-semibold tabular-nums">
                {gbp(daily.expectedValue)}
              </p>
            </div>
            <div className="pb-1">
              <p className="text-muted-foreground text-xs">Expected placements</p>
              <p className="font-mono text-xl leading-tight font-semibold tabular-nums">
                {daily.expectedPlacements}
              </p>
            </div>
          </div>

          {totalStageValue > 0 ? (
            <div className="mt-5">
              <div className="flex h-3 gap-0.5 overflow-hidden rounded-full">
                {daily.valueByStage.map((entry, index) => (
                  <div
                    key={entry.stage}
                    className="bg-primary min-w-1 rounded-[2px] transition-all duration-500"
                    style={{
                      width: `${(entry.value / totalStageValue) * 100}%`,
                      opacity: STAGE_RAMP_OPACITY[index % STAGE_RAMP_OPACITY.length],
                    }}
                    title={`${entry.label}: ${gbp(entry.value)} · ${entry.count} candidate${entry.count === 1 ? "" : "s"}`}
                  />
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                {daily.valueByStage.map((entry, index) => (
                  <span
                    key={entry.stage}
                    className="text-muted-foreground flex items-center gap-1.5 text-[11px]"
                  >
                    <span
                      className="bg-primary size-2 rounded-[2px]"
                      style={{ opacity: STAGE_RAMP_OPACITY[index % STAGE_RAMP_OPACITY.length] }}
                    />
                    {entry.label}
                    <span className="text-foreground font-mono font-semibold">{entry.count}</span>
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          <p className="text-muted-foreground/70 mt-3 text-[10px]">{daily.assumption}</p>
        </div>

        <div className="lg:border-l lg:pl-6">
          <div className="grid grid-cols-2 gap-2.5">
            <Link
              href="/pipeline"
              className="bg-success/8 hover:bg-success/12 rounded-xl px-3.5 py-3 transition-colors"
            >
              <p className="text-success flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.1em] uppercase">
                <TrendingUp className="size-3" /> Offers in play
              </p>
              <p className="mt-1.5 font-mono text-2xl leading-none font-semibold tabular-nums">
                {daily.offersOut}
              </p>
              <p className="text-muted-foreground mt-1 font-mono text-[11px]">
                {daily.offersValue > 0 ? `~${gbp(daily.offersValue)}` : "unpriced"}
              </p>
            </Link>
            {daily.risks.slice(0, 3).map((risk) => (
              <Link
                key={risk.short}
                href={risk.href}
                className="bg-destructive/6 hover:bg-destructive/10 rounded-xl px-3.5 py-3 transition-colors"
              >
                <p className="text-destructive flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.1em] uppercase">
                  <TriangleAlert className="size-3" /> {risk.short}
                </p>
                <p className="mt-1.5 font-mono text-2xl leading-none font-semibold tabular-nums">
                  {risk.count}
                </p>
                <p className="text-muted-foreground mt-1 truncate text-[11px]">{risk.label}</p>
              </Link>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {daily.quickActions.map((action) => (
              <Button key={action.label} asChild size="sm" variant="outline" className="h-7 text-xs">
                <Link href={action.href}>{action.label}</Link>
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Terminal surfaces: the ticker, the ranked action queue, job risk and the
 * run-rate forecast. Dense, monospace numerals, decision-first — every panel
 * ends in a verb, not a number.
 */

// -------------------------------------------------------------- ticker ---

export function TickerStrip({ items }: { items: TickerItem[] }) {
  return (
    <div className="animate-fade-up bg-card flex items-stretch divide-x overflow-x-auto rounded-xl border shadow-xs">
      {items.map((item) => (
        <div key={item.label} className="flex min-w-fit flex-1 flex-col gap-0.5 px-4 py-2.5">
          <span className="text-muted-foreground text-[10px] font-semibold tracking-[0.1em] whitespace-nowrap">
            {item.label}
          </span>
          <span className="flex items-baseline gap-1.5 whitespace-nowrap">
            <span
              className={cn(
                "font-mono text-lg leading-none font-semibold tabular-nums",
                item.tone === "positive" && "text-success",
                item.tone === "negative" && "text-destructive",
              )}
            >
              {item.value}
            </span>
            {item.delta ? (
              <span className="text-muted-foreground text-[10px]">{item.delta.text}</span>
            ) : null}
          </span>
        </div>
      ))}
    </div>
  );
}

// -------------------------------------------------------- action queue ---

const IMPACT_STYLE: Record<NextAction["impact"], string> = {
  critical: "bg-destructive/12 text-destructive",
  high: "bg-warning/15 text-[oklch(0.6_0.14_70)] dark:text-warning",
  medium: "bg-primary/10 text-primary",
};

export function ActionQueue({ actions }: { actions: NextAction[] }) {
  return (
    <Card className="animate-fade-up h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="gradient-primary flex size-7 items-center justify-center rounded-lg text-white">
            <ListTodo className="size-4" />
          </span>
          Next best actions
          {actions.length > 0 ? <Badge variant="secondary">{actions.length}</Badge> : null}
        </CardTitle>
        <span className="text-muted-foreground text-xs">ranked by urgency × impact</span>
      </CardHeader>
      <CardContent>
        {actions.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm font-medium">Queue clear</p>
            <p className="text-muted-foreground mt-1 text-xs">
              Nothing needs you right now — the engine re-ranks on every load.
            </p>
          </div>
        ) : (
          <ol className="space-y-1.5">
            {actions.map((action) => (
              <li key={`${action.rank}-${action.title}`}>
                <Link
                  href={action.href}
                  className="group bg-secondary/50 hover:bg-accent/60 flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors"
                >
                  <span className="text-muted-foreground w-5 shrink-0 font-mono text-sm font-semibold">
                    {action.rank}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">{action.title}</span>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-1.5 py-px text-[10px] font-semibold tracking-wide uppercase",
                          IMPACT_STYLE[action.impact],
                        )}
                      >
                        {action.impact}
                      </span>
                    </span>
                    <span className="text-muted-foreground block truncate text-xs">
                      {action.detail}
                    </span>
                  </span>
                  <span className="flex w-16 shrink-0 flex-col items-end gap-1">
                    <span className="text-muted-foreground font-mono text-[11px] font-semibold">
                      {Math.min(Math.round(action.score), 99)}
                    </span>
                    <span className="bg-border h-1 w-full overflow-hidden rounded-full">
                      <span
                        className={cn(
                          "block h-full rounded-full",
                          action.impact === "critical"
                            ? "bg-destructive"
                            : action.impact === "high"
                              ? "bg-warning"
                              : "bg-primary",
                        )}
                        style={{ width: `${Math.min(action.score, 100)}%` }}
                      />
                    </span>
                  </span>
                  <span className="text-primary flex w-20 shrink-0 items-center justify-end gap-1 text-xs font-medium opacity-0 transition-opacity group-hover:opacity-100">
                    {action.cta}
                    <ArrowRight className="size-3" />
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

// ------------------------------------------------------------ job risk ---

const RISK_STYLE: Record<JobRisk["level"], string> = {
  high: "bg-destructive/12 text-destructive",
  medium: "bg-warning/15 text-[oklch(0.6_0.14_70)] dark:text-warning",
  low: "bg-success/12 text-success",
};

export function RiskPanel({ risks }: { risks: JobRisk[] }) {
  return (
    <Card className="animate-fade-up h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <Flame className="text-destructive size-4" />
          Roles at risk
        </CardTitle>
        <span className="text-muted-foreground text-xs">stall probability</span>
      </CardHeader>
      <CardContent className="flex h-full flex-col">
        {risks.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            No open role is flagged — risk re-scores on every load.
          </p>
        ) : (
          <ul className="space-y-2">
            {risks.map((risk) => (
              <li key={risk.jobId}>
                <Link
                  href={`/pipeline?job=${risk.jobId}`}
                  className="group bg-secondary/50 hover:bg-accent/60 block rounded-lg px-3 py-2.5 transition-colors"
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate text-sm font-medium">{risk.title}</span>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-px font-mono text-xs font-semibold",
                        RISK_STYLE[risk.level],
                      )}
                    >
                      {risk.score}
                    </span>
                  </span>
                  <span className="text-muted-foreground mt-0.5 block truncate text-xs">
                    {risk.clientName ? `${risk.clientName} · ` : ""}
                    {risk.reasons.join(" · ")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link
          href="/jobs"
          className="text-primary mt-auto flex items-center gap-1 pt-3 text-xs font-medium hover:underline"
        >
          View all roles <ArrowRight className="size-3" />
        </Link>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------- forecast + velocity ---

export function ForecastCard({
  forecast,
  velocity,
}: {
  forecast: Forecast;
  velocity: StageVelocity[];
}) {
  const gbp = (value: number) =>
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <Card className="animate-fade-up h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <ChartNoAxesCombined className="text-primary size-4" />
          Forecast
        </CardTitle>
        <span className="text-muted-foreground text-xs">{forecast.basis}</span>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-secondary/50 rounded-lg px-3 py-2.5">
            <p className="text-muted-foreground text-[10px] font-semibold tracking-[0.1em] uppercase">
              Month proj.
            </p>
            <p className="mt-1 flex items-baseline gap-1.5">
              <span className="font-mono text-xl font-semibold tabular-nums">
                {gbp(forecast.monthFeesProjected)}
              </span>
              <TrendingUp className="text-success size-3.5" />
            </p>
            <p className="text-muted-foreground text-xs">
              {gbp(forecast.monthFees)} booked · {forecast.monthPlacements} placement
              {forecast.monthPlacements === 1 ? "" : "s"}
            </p>
          </div>
          <div className="bg-secondary/50 rounded-lg px-3 py-2.5">
            <p className="text-muted-foreground text-[10px] font-semibold tracking-[0.1em] uppercase">
              Quarter proj.
            </p>
            <p className="mt-1 font-mono text-xl font-semibold tabular-nums">
              {gbp(forecast.quarterFeesProjected)}
            </p>
            <p className="text-muted-foreground text-xs">booked + trailing-3-month avg</p>
          </div>
        </div>

        <div>
          <p className="text-muted-foreground mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.1em] uppercase">
            <Gauge className="size-3" /> Stage velocity · median days to move
          </p>
          {velocity.length === 0 ? (
            <p className="text-muted-foreground text-xs">
              Not enough observed stage moves yet — velocity builds as the pipeline is worked.
            </p>
          ) : (
            <ul className="space-y-1">
              {velocity.map((entry) => (
                <li key={entry.stage} className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground w-24 shrink-0 capitalize">
                    {entry.stage}
                  </span>
                  <span className="bg-primary/15 h-1.5 flex-1 overflow-hidden rounded-full">
                    <span
                      className="bg-primary block h-full rounded-full"
                      style={{
                        width: `${Math.min((entry.medianDays / 21) * 100, 100)}%`,
                      }}
                    />
                  </span>
                  <span className="w-14 shrink-0 text-right font-mono font-semibold">
                    {entry.medianDays}d
                  </span>
                  <span className="text-muted-foreground w-8 shrink-0 text-right text-[10px]">
                    n={entry.samples}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="text-muted-foreground flex items-start gap-1.5 text-[11px] leading-snug">
          <CircleAlert className="mt-0.5 size-3 shrink-0" />
          Projections extrapolate booked business only; they carry no pipeline-probability model
          yet.
        </p>
      </CardContent>
    </Card>
  );
}
