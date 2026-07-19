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
import Link from "next/link";
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

// ---------------------------------------------------------- mini charts ---

function MiniArea({ points }: { points: number[] }) {
  const width = 220;
  const height = 44;
  const max = Math.max(...points, 1);
  const step = width / (points.length - 1);
  const x = (index: number) => index * step;
  const y = (value: number) => height - 4 - (value / max) * (height - 10);

  const line = points
    .map((value, index) => `${index === 0 ? "M" : "L"}${x(index).toFixed(1)},${y(value).toFixed(1)}`)
    .join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="h-11 w-full"
      role="img"
      aria-label="12-week trend"
    >
      <path d={area} className="fill-primary/10" />
      <path
        d={line}
        className="stroke-primary fill-none"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle
        cx={x(points.length - 1)}
        cy={y(points[points.length - 1])}
        r={3}
        className="fill-primary"
      />
    </svg>
  );
}

function MiniBars({ points }: { points: { label: string; value: number }[] }) {
  const max = Math.max(...points.map((point) => point.value), 1);
  return (
    <div className="flex h-11 items-end gap-1.5" role="img" aria-label="Breakdown">
      {points.map((point) => (
        <div
          key={point.label}
          className="flex h-full flex-1 flex-col items-center justify-end gap-0.5"
        >
          <div
            className={cn("bg-primary w-full rounded-t-[3px]", point.value === 0 && "opacity-15")}
            style={{ height: `${Math.max((point.value / max) * 100, point.value > 0 ? 14 : 6)}%` }}
          />
          <span className="text-muted-foreground text-[9px] leading-none">{point.label}</span>
        </div>
      ))}
    </div>
  );
}

function MiniDonut({ points }: { points: { label: string; value: number }[] }) {
  const total = points.reduce((sum, point) => sum + point.value, 0);
  const size = 44;
  const radius = 17;
  const strokeWidth = 7;
  const circumference = 2 * Math.PI * radius;
  const fractions = points.map((point) => (total > 0 ? point.value / total : 0));
  // Ordinal stages → sequential single-hue ring segments.
  const opacities = [0.4, 0.7, 1];

  return (
    <div className="flex h-11 items-center gap-3" role="img" aria-label="Breakdown">
      <div className="relative shrink-0">
        <svg viewBox={`0 0 ${size} ${size}`} className="size-11 -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            className="stroke-muted"
          />
          {fractions.map((fraction, index) => {
            const before = fractions.slice(0, index).reduce((sum, value) => sum + value, 0);
            return (
              <circle
                key={points[index].label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                strokeWidth={strokeWidth}
                strokeDasharray={`${Math.max(fraction * circumference - 1.5, 0)} ${circumference}`}
                strokeDashoffset={-before * circumference}
                className="stroke-primary transition-all duration-500"
                opacity={opacities[index % opacities.length]}
              />
            );
          })}
        </svg>
      </div>
      <ul className="min-w-0 flex-1 space-y-0.5">
        {points.map((point, index) => (
          <li key={point.label} className="flex items-center gap-1.5 text-[10px] leading-tight">
            <span
              className="bg-primary size-1.5 shrink-0 rounded-full"
              style={{ opacity: opacities[index % opacities.length] }}
            />
            <span className="text-muted-foreground min-w-0 flex-1 truncate">{point.label}</span>
            <span className="font-mono font-semibold">{point.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ----------------------------------------------------------------- card ---

const ICONS = {
  handshake: Handshake,
  kanban: KanbanSquare,
  calendar: CalendarClock,
  "user-plus": UserPlus,
} satisfies Record<string, LucideIcon>;

export type KpiChart =
  | { type: "area"; points: number[] }
  | { type: "bars"; points: { label: string; value: number }[] }
  | { type: "donut"; points: { label: string; value: number }[] };

export type KpiCardProps = {
  label: string;
  value: number;
  icon: keyof typeof ICONS;
  href: string;
  tone: "blue" | "violet" | "emerald" | "amber";
  trend?: { current: number; previous: number };
  chart?: KpiChart;
  hint?: string;
};

const tones: Record<KpiCardProps["tone"], string> = {
  blue: "bg-primary/12 text-primary",
  violet: "bg-[oklch(0.55_0.2_295)]/12 text-[oklch(0.5_0.2_295)] dark:text-[oklch(0.75_0.14_295)]",
  emerald: "bg-success/12 text-success",
  amber: "bg-warning/15 text-[oklch(0.6_0.14_70)] dark:text-warning",
};

export function KpiCard({ label, value, icon, tone, trend, chart, hint, href }: KpiCardProps) {
  const Icon = ICONS[icon];
  const displayed = useCountUp(value);

  const delta =
    trend && trend.previous > 0
      ? Math.round(((trend.current - trend.previous) / trend.previous) * 100)
      : null;
  const isNew = trend ? trend.previous === 0 && trend.current > 0 : false;

  return (
    <Link href={href} className="group block">
      <Card className="card-lift animate-fade-up relative h-full gap-0 overflow-hidden py-5">
        <div className="gradient-primary absolute inset-x-0 top-0 h-0.5 opacity-60" />
        <CardContent className="flex h-full flex-col gap-3 px-5">
          <div className="flex items-start justify-between gap-2">
            <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.08em] uppercase">
              {label}
            </p>
            <div
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-lg",
                tones[tone],
              )}
            >
              <Icon className="size-4" />
            </div>
          </div>

          <div className="flex items-baseline gap-2.5">
            <p className="font-mono text-4xl font-semibold tracking-tight tabular-nums">
              {displayed}
            </p>
            {delta !== null ? (
              <span
                className={cn(
                  "flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs font-medium",
                  delta >= 0 ? "bg-success/12 text-success" : "bg-destructive/10 text-destructive",
                )}
              >
                {delta >= 0 ? (
                  <TrendingUp className="size-3" />
                ) : (
                  <TrendingDown className="size-3" />
                )}
                {delta >= 0 ? "+" : ""}
                {delta}%
              </span>
            ) : isNew ? (
              <span className="bg-success/12 text-success rounded-full px-1.5 py-0.5 text-xs font-medium">
                New
              </span>
            ) : null}
          </div>

          {chart ? (
            <div className="mt-auto">
              {chart.type === "area" ? (
                <MiniArea points={chart.points} />
              ) : chart.type === "donut" ? (
                <MiniDonut points={chart.points} />
              ) : (
                <MiniBars points={chart.points} />
              )}
            </div>
          ) : null}

          {hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
        </CardContent>
      </Card>
    </Link>
  );
}
