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
import { useEffect, useId, useState } from "react";

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

/** Catmull-Rom → cubic bezier so sparklines read as smooth curves. */
function smoothPath(xs: number[], ys: number[]): string {
  if (xs.length < 2) return "";
  let d = `M${xs[0].toFixed(1)},${ys[0].toFixed(1)}`;
  for (let i = 0; i < xs.length - 1; i++) {
    const x0 = xs[Math.max(i - 1, 0)];
    const y0 = ys[Math.max(i - 1, 0)];
    const x1 = xs[i];
    const y1 = ys[i];
    const x2 = xs[i + 1];
    const y2 = ys[i + 1];
    const x3 = xs[Math.min(i + 2, xs.length - 1)];
    const y3 = ys[Math.min(i + 2, ys.length - 1)];
    const c1x = x1 + (x2 - x0) / 6;
    const c1y = y1 + (y2 - y0) / 6;
    const c2x = x2 - (x3 - x1) / 6;
    const c2y = y2 - (y3 - y1) / 6;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`;
  }
  return d;
}

function SparkArea({ points, color }: { points: number[]; color: string }) {
  const gradientId = useId();
  const width = 220;
  const height = 52;
  const max = Math.max(...points, 1);
  const step = width / (points.length - 1);
  const xs = points.map((_, index) => index * step);
  const ys = points.map((value) => height - 5 - (value / max) * (height - 14));

  const line = smoothPath(xs, ys);
  const area = `${line} L${width},${height} L0,${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="h-13 w-full"
      role="img"
      aria-label="12-week trend"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.32" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={xs[xs.length - 1]} cy={ys[ys.length - 1]} r={6} fill={color} opacity={0.25} />
      <circle cx={xs[xs.length - 1]} cy={ys[ys.length - 1]} r={3} fill={color} />
    </svg>
  );
}

// ----------------------------------------------------------------- card ---

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
  tone: "blue" | "violet" | "emerald" | "amber";
  trend?: { current: number; previous: number };
  points: number[];
  hint?: string;
};

const toneTile: Record<KpiCardProps["tone"], string> = {
  blue: "bg-primary/12 text-primary",
  violet: "bg-[#8b5cf6]/12 text-[#7c3aed] dark:text-[#a78bfa]",
  emerald: "bg-success/12 text-success",
  amber: "bg-warning/15 text-[oklch(0.6_0.14_70)] dark:text-warning",
};

// Sparkline strokes come from the validated categorical palette vars.
const toneColor: Record<KpiCardProps["tone"], string> = {
  blue: "var(--cat-1)",
  amber: "var(--cat-2)",
  violet: "var(--cat-3)",
  emerald: "var(--cat-4)",
};

export function KpiCard({ label, value, icon, tone, trend, points, hint, href }: KpiCardProps) {
  const Icon = ICONS[icon];
  const displayed = useCountUp(value);

  const delta =
    trend && trend.previous > 0
      ? Math.round(((trend.current - trend.previous) / trend.previous) * 100)
      : null;
  const isNew = trend ? trend.previous === 0 && trend.current > 0 : false;

  return (
    <Link href={href} className="group block">
      <Card className="card-lift animate-fade-up relative h-full gap-0 overflow-hidden py-5 pb-0">
        <CardContent className="flex h-full flex-col px-0">
          <div className="flex items-start justify-between gap-2 px-5">
            <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.08em] uppercase">
              {label}
            </p>
            <div
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-lg",
                toneTile[tone],
              )}
            >
              <Icon className="size-4" />
            </div>
          </div>

          <div className="mt-2 px-5">
            <p className="font-mono text-[2.6rem] leading-none font-semibold tracking-tight tabular-nums">
              {displayed}
            </p>
            <p className="mt-2 flex items-center gap-1.5 text-xs">
              {delta !== null ? (
                <>
                  <span
                    className={cn(
                      "flex items-center gap-0.5 font-semibold",
                      delta >= 0 ? "text-success" : "text-destructive",
                    )}
                  >
                    {delta >= 0 ? (
                      <TrendingUp className="size-3.5" />
                    ) : (
                      <TrendingDown className="size-3.5" />
                    )}
                    {Math.abs(delta)}%
                  </span>
                  <span className="text-muted-foreground">vs last month</span>
                </>
              ) : isNew ? (
                <>
                  <span className="text-success flex items-center gap-0.5 font-semibold">
                    <TrendingUp className="size-3.5" /> New
                  </span>
                  <span className="text-muted-foreground">vs last month</span>
                </>
              ) : (
                <span className="text-muted-foreground">{hint ?? "last 12 weeks"}</span>
              )}
            </p>
          </div>

          <div className="mt-4">
            <SparkArea points={points} color={toneColor[tone]} />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
