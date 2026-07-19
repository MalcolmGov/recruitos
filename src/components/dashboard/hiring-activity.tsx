"use client";

import { Briefcase, CalendarClock, FileText, Handshake, Trophy } from "lucide-react";
import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * The hiring command center: 12-week stat chips + a three-series line chart.
 * Series colors are the validated categorical vars (fixed order: cat-1 blue
 * applications, cat-2 amber offers, cat-4 emerald placements) with a legend —
 * identity is never color-alone.
 */

const SERIES_META = [
  { key: "applications", label: "Applications", cssVar: "var(--cat-1)" },
  { key: "offers", label: "Offers", cssVar: "var(--cat-2)" },
  { key: "placements", label: "Placements", cssVar: "var(--cat-4)" },
] as const;

type SeriesKey = (typeof SERIES_META)[number]["key"];

export function HiringActivity({
  series,
  stats,
}: {
  series: Record<SeriesKey, number[]>;
  stats: { newJobs: number; applications: number; interviews: number; offers: number; placements: number };
}) {
  const [hover, setHover] = useState<number | null>(null);

  const width = 640;
  const height = 200;
  const padX = 10;
  const padY = 16;
  const pointCount = series.applications.length;
  const max = Math.max(...SERIES_META.flatMap((meta) => series[meta.key]), 1);
  const step = (width - padX * 2) / (pointCount - 1);
  const x = (index: number) => padX + index * step;
  const y = (value: number) => height - padY - (value / max) * (height - padY * 2);

  const linePath = (points: number[]) =>
    points
      .map((value, index) => `${index === 0 ? "M" : "L"}${x(index).toFixed(1)},${y(value).toFixed(1)}`)
      .join(" ");

  const chips = [
    { icon: Briefcase, label: "New jobs", value: stats.newJobs },
    { icon: FileText, label: "Applications", value: stats.applications },
    { icon: CalendarClock, label: "Interviews", value: stats.interviews },
    { icon: Trophy, label: "Offers", value: stats.offers },
    { icon: Handshake, label: "Placements", value: stats.placements },
  ];

  const weekLabel = (index: number) => {
    const weeksAgo = pointCount - 1 - index;
    if (weeksAgo === 0) return "This week";
    if (weeksAgo === 1) return "Last week";
    return `${weeksAgo} weeks ago`;
  };

  return (
    <Card className="animate-fade-up">
      <CardHeader className="flex flex-row items-baseline justify-between">
        <CardTitle className="text-base">Hiring activity</CardTitle>
        <span className="text-muted-foreground text-xs">Last 12 weeks</span>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          {chips.map((chip) => (
            <div key={chip.label} className="flex items-center gap-2">
              <span className="bg-primary/10 text-primary flex size-7 items-center justify-center rounded-lg">
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
            aria-label="Applications, offers and placements per week over the last 12 weeks"
            onMouseLeave={() => setHover(null)}
          >
            {[0.25, 0.5, 0.75].map((fraction) => (
              <line
                key={fraction}
                x1={padX}
                x2={width - padX}
                y1={y(max * fraction)}
                y2={y(max * fraction)}
                className="stroke-border"
                strokeWidth={1}
                strokeDasharray="2 4"
              />
            ))}
            {SERIES_META.map((meta) => (
              <path
                key={meta.key}
                d={linePath(series[meta.key])}
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
              className="bg-popover text-popover-foreground pointer-events-none absolute top-0 z-10 -translate-x-1/2 space-y-1 rounded-lg border px-2.5 py-2 text-xs shadow-md"
              style={{ left: `${Math.min(Math.max((x(hover) / width) * 100, 12), 88)}%` }}
            >
              <p className="text-muted-foreground">{weekLabel(hover)}</p>
              {SERIES_META.map((meta) => (
                <p key={meta.key} className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full" style={{ backgroundColor: meta.cssVar }} />
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
