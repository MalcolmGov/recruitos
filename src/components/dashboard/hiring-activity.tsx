"use client";

import {
  Briefcase,
  CalendarClock,
  ChevronDown,
  FileText,
  Handshake,
  Trophy,
} from "lucide-react";
import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * The hiring command center: 12-week stat chips + a five-series line chart.
 * Series take the validated categorical vars in fixed catalog order (never
 * cycled) with a legend — identity is never color-alone.
 */

const SERIES_META = [
  { key: "applications", label: "Applications", cssVar: "var(--cat-1)" },
  { key: "screenings", label: "Screenings", cssVar: "var(--cat-2)" },
  { key: "interviews", label: "Interviews", cssVar: "var(--cat-3)" },
  { key: "offers", label: "Offers", cssVar: "var(--cat-4)" },
  { key: "placements", label: "Placements", cssVar: "var(--cat-5)" },
] as const;

type SeriesKey = (typeof SERIES_META)[number]["key"];

/** Catmull-Rom → cubic bezier for smooth series curves. */
function smoothPath(xs: number[], ys: number[]): string {
  if (xs.length < 2) return "";
  let d = `M${xs[0].toFixed(1)},${ys[0].toFixed(1)}`;
  for (let i = 0; i < xs.length - 1; i++) {
    const x0 = xs[Math.max(i - 1, 0)];
    const y0 = ys[Math.max(i - 1, 0)];
    const x2 = xs[i + 1];
    const y2 = ys[i + 1];
    const x3 = xs[Math.min(i + 2, xs.length - 1)];
    const y3 = ys[Math.min(i + 2, ys.length - 1)];
    const c1x = xs[i] + (x2 - x0) / 6;
    const c1y = ys[i] + (y2 - y0) / 6;
    const c2x = x2 - (x3 - xs[i]) / 6;
    const c2y = y2 - (y3 - ys[i]) / 6;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`;
  }
  return d;
}

/** Monday-start date of the week `weeksAgo` weeks back (mirrors date_trunc('week')). */
function weekStart(weeksAgo: number): Date {
  const now = new Date();
  const day = (now.getDay() + 6) % 7;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
  monday.setDate(monday.getDate() - weeksAgo * 7);
  return monday;
}

export function HiringActivity({
  series,
  stats,
}: {
  series: Record<SeriesKey, number[]>;
  stats: {
    newJobs: number;
    applications: number;
    interviews: number;
    offers: number;
    placements: number;
  };
}) {
  const [hover, setHover] = useState<number | null>(null);

  const width = 640;
  const height = 210;
  const padL = 30;
  const padR = 10;
  const padY = 18;
  const pointCount = series.applications.length;
  const rawMax = Math.max(...SERIES_META.flatMap((meta) => series[meta.key]), 1);
  const max = Math.max(Math.ceil(rawMax / 2) * 2, 2);
  const step = (width - padL - padR) / (pointCount - 1);
  const x = (index: number) => padL + index * step;
  const y = (value: number) => height - padY - (value / max) * (height - padY * 2);

  const xs = Array.from({ length: pointCount }, (_, index) => x(index));

  const chips = [
    { icon: Briefcase, label: "New jobs", value: stats.newJobs, cssVar: "var(--primary)" },
    { icon: FileText, label: "Applications", value: stats.applications, cssVar: "var(--cat-1)" },
    { icon: CalendarClock, label: "Interviews", value: stats.interviews, cssVar: "var(--cat-3)" },
    { icon: Trophy, label: "Offers", value: stats.offers, cssVar: "var(--cat-4)" },
    { icon: Handshake, label: "Placements", value: stats.placements, cssVar: "var(--cat-5)" },
  ];

  const weekLabel = (index: number) => {
    const weeksAgo = pointCount - 1 - index;
    if (weeksAgo === 0) return "This week";
    if (weeksAgo === 1) return "Last week";
    return `${weeksAgo} weeks ago`;
  };

  const axisDate = (index: number) =>
    weekStart(pointCount - 1 - index).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });

  const yTicks = [0, max / 2, max];
  const xTickIndexes = [0, 4, 8, pointCount - 1];

  return (
    <Card className="animate-fade-up">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Hiring activity</CardTitle>
        <span className="text-muted-foreground border-input flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs">
          Last 12 weeks
          <ChevronDown className="size-3" />
        </span>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          {chips.map((chip) => (
            <div key={chip.label} className="flex items-center gap-2">
              <span
                className="flex size-7 items-center justify-center rounded-lg"
                style={{
                  backgroundColor: `color-mix(in oklab, ${chip.cssVar} 14%, transparent)`,
                  color: chip.cssVar,
                }}
              >
                <chip.icon className="size-3.5" />
              </span>
              <span>
                <span className="font-mono text-base leading-none font-semibold">{chip.value}</span>
                <span className="text-muted-foreground ml-1.5 text-xs">{chip.label}</span>
              </span>
            </div>
          ))}
        </div>

        <div className="relative">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full"
            role="img"
            aria-label="Applications, screenings, interviews, offers and placements per week over the last 12 weeks"
            onMouseLeave={() => setHover(null)}
          >
            {yTicks.map((tick) => (
              <g key={tick}>
                <line
                  x1={padL}
                  x2={width - padR}
                  y1={y(tick)}
                  y2={y(tick)}
                  className="stroke-border"
                  strokeWidth={1}
                  strokeDasharray={tick === 0 ? undefined : "2 4"}
                />
                <text
                  x={padL - 8}
                  y={y(tick) + 3}
                  textAnchor="end"
                  className="fill-muted-foreground text-[10px]"
                >
                  {tick}
                </text>
              </g>
            ))}
            <g suppressHydrationWarning>
              {xTickIndexes.map((index) => (
                <text
                  key={index}
                  x={x(index)}
                  y={height - 2}
                  textAnchor={index === 0 ? "start" : index === pointCount - 1 ? "end" : "middle"}
                  className="fill-muted-foreground text-[10px]"
                  suppressHydrationWarning
                >
                  {axisDate(index)}
                </text>
              ))}
            </g>
            {SERIES_META.map((meta) => (
              <path
                key={meta.key}
                d={smoothPath(
                  xs,
                  series[meta.key].map((value) => y(value)),
                )}
                fill="none"
                stroke={meta.cssVar}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
            {hover !== null ? (
              <>
                <line
                  x1={x(hover)}
                  x2={x(hover)}
                  y1={padY / 2}
                  y2={height - padY}
                  className="stroke-muted-foreground/40"
                  strokeWidth={1}
                />
                {SERIES_META.map((meta) => (
                  <circle
                    key={meta.key}
                    cx={x(hover)}
                    cy={y(series[meta.key][hover])}
                    r={3.5}
                    fill={meta.cssVar}
                    className="stroke-card"
                    strokeWidth={2}
                  />
                ))}
              </>
            ) : null}
            {series.applications.map((_, index) => (
              <rect
                key={index}
                x={x(index) - step / 2}
                y={0}
                width={step}
                height={height}
                fill="transparent"
                onMouseEnter={() => setHover(index)}
              />
            ))}
          </svg>
          {hover !== null ? (
            <div
              className="bg-popover text-popover-foreground pointer-events-none absolute top-0 z-10 w-40 -translate-x-1/2 space-y-1 rounded-lg border px-2.5 py-2 text-xs shadow-md"
              style={{ left: `${Math.min(Math.max((x(hover) / width) * 100, 14), 86)}%` }}
            >
              <p className="text-muted-foreground">{weekLabel(hover)}</p>
              {SERIES_META.map((meta) => (
                <p key={meta.key} className="flex items-center gap-1.5">
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: meta.cssVar }}
                  />
                  {meta.label}
                  <span className="ml-auto pl-3 font-mono font-semibold">
                    {series[meta.key][hover]}
                  </span>
                </p>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-4">
          {SERIES_META.map((meta) => (
            <span key={meta.key} className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <span className="size-2 rounded-full" style={{ backgroundColor: meta.cssVar }} />
              {meta.label}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
