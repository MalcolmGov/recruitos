"use client";

import {
  CalendarClock,
  Handshake,
  KanbanSquare,
  TrendingDown,
  TrendingUp,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** rAF count-up that respects prefers-reduced-motion. */
function useCountUp(target: number, durationMs = 700): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let frame: number;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const startedAt = performance.now();
    const tick = (now: number) => {
      const progress = reduceMotion ? 1 : Math.min(1, (now - startedAt) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);

  return value;
}

function Sparkline({ points }: { points: number[] }) {
  if (points.length < 2 || points.every((point) => point === 0)) return null;
  const width = 96;
  const height = 28;
  const max = Math.max(...points, 1);
  const step = width / (points.length - 1);
  const coords = points.map(
    (point, index) =>
      [index * step, height - 3 - (point / max) * (height - 6)] as const,
  );
  const path = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${path} L${width},${height} L0,${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-7 w-24"
      role="img"
      aria-label="8-week trend"
    >
      <path d={area} className="fill-primary/10" />
      <path d={path} className="stroke-primary fill-none" strokeWidth={2} strokeLinecap="round" />
      <circle
        cx={coords[coords.length - 1][0]}
        cy={coords[coords.length - 1][1]}
        r={2.5}
        className="fill-primary"
      />
    </svg>
  );
}

const ICONS = {
  handshake: Handshake,
  kanban: KanbanSquare,
  calendar: CalendarClock,
  "user-plus": UserPlus,
} satisfies Record<string, LucideIcon>;

export type KpiCardProps = {
  label: string;
  value: number;
  icon: keyof typeof ICONS;
  href: string;
  /** icon-tile tint */
  tone: "blue" | "violet" | "emerald" | "amber";
  trend?: { current: number; previous: number };
  sparkline?: number[];
  hint?: string;
};

const tones: Record<KpiCardProps["tone"], string> = {
  blue: "bg-primary/12 text-primary",
  violet: "bg-[oklch(0.55_0.2_295)]/12 text-[oklch(0.5_0.2_295)] dark:text-[oklch(0.75_0.14_295)]",
  emerald: "bg-success/12 text-success",
  amber: "bg-warning/15 text-[oklch(0.6_0.14_70)] dark:text-warning",
};

export function KpiCard({ label, value, icon, tone, trend, sparkline, hint }: KpiCardProps) {
  const Icon = ICONS[icon];
  const displayed = useCountUp(value);

  const delta =
    trend && trend.previous > 0
      ? Math.round(((trend.current - trend.previous) / trend.previous) * 100)
      : null;
  const isNew = trend ? trend.previous === 0 && trend.current > 0 : false;

  return (
    <Card className="card-lift animate-fade-up relative gap-0 overflow-hidden py-5">
      <div className="gradient-primary absolute inset-x-0 top-0 h-0.5 opacity-60" />
      <CardContent className="space-y-3 px-5">
        <div className="flex items-start justify-between">
          <div className={cn("flex size-9 items-center justify-center rounded-xl", tones[tone])}>
            <Icon className="size-4.5" />
          </div>
          {sparkline ? <Sparkline points={sparkline} /> : null}
        </div>
        <div>
          <p className="font-mono text-3xl font-semibold tracking-tight tabular-nums">
            {displayed}
          </p>
          <p className="text-muted-foreground mt-0.5 text-sm">{label}</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {delta !== null ? (
            <span
              className={cn(
                "flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium",
                delta >= 0 ? "bg-success/12 text-success" : "bg-destructive/10 text-destructive",
              )}
            >
              {delta >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
              {delta >= 0 ? "+" : ""}
              {delta}%
            </span>
          ) : isNew ? (
            <span className="bg-success/12 text-success rounded-full px-1.5 py-0.5 font-medium">
              New
            </span>
          ) : null}
          {hint ? <span className="text-muted-foreground">{hint}</span> : null}
        </div>
      </CardContent>
    </Card>
  );
}
