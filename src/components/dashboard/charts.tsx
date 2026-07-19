"use client";

import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Hand-rolled SVG charts following the dataviz method: thin marks, 2px line,
 * rounded data ends, surface gaps between fills, hover tooltips, direct
 * labels where they earn their place. Categorical hues come from the
 * validated --cat-* variables (fixed order, never cycled); single-measure
 * charts stay on the primary hue.
 */

// ------------------------------------------------------------ area chart ---

export function ActivityAreaChart({ points }: { points: number[] }) {
  const [hover, setHover] = useState<number | null>(null);

  const width = 560;
  const height = 180;
  const padX = 8;
  const padY = 14;
  const max = Math.max(...points, 1);
  const step = (width - padX * 2) / (points.length - 1);
  const x = (index: number) => padX + index * step;
  const y = (value: number) => height - padY - (value / max) * (height - padY * 2);

  const linePath = points
    .map((value, index) => `${index === 0 ? "M" : "L"}${x(index).toFixed(1)},${y(value).toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L${x(points.length - 1)},${height - padY} L${x(0)},${height - padY} Z`;

  const weekLabel = (index: number) => {
    const weeksAgo = points.length - 1 - index;
    if (weeksAgo === 0) return "This week";
    if (weeksAgo === 1) return "Last week";
    return `${weeksAgo} weeks ago`;
  };

  return (
    <Card className="animate-fade-up">
      <CardHeader className="flex flex-row items-baseline justify-between">
        <CardTitle className="text-base">Hiring activity</CardTitle>
        <span className="text-muted-foreground text-xs">
          candidates entering pipelines · last 12 weeks
        </span>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full"
            role="img"
            aria-label="Weekly pipeline additions over the last 12 weeks"
            onMouseLeave={() => setHover(null)}
          >
            {/* recessive gridlines */}
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
            <path d={areaPath} className="fill-primary/10" />
            <path
              d={linePath}
              className="stroke-primary fill-none"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
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
                <circle cx={x(hover)} cy={y(points[hover])} r={4} className="fill-primary" />
                <circle
                  cx={x(hover)}
                  cy={y(points[hover])}
                  r={7}
                  className="fill-primary/20"
                />
              </>
            ) : (
              <circle
                cx={x(points.length - 1)}
                cy={y(points[points.length - 1])}
                r={3}
                className="fill-primary"
              />
            )}
            {/* invisible hover targets, one per point (bigger than the mark) */}
            {points.map((_, index) => (
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
              className="bg-popover text-popover-foreground pointer-events-none absolute -top-1 z-10 -translate-x-1/2 rounded-lg border px-2.5 py-1.5 text-xs shadow-md"
              style={{ left: `${(x(hover) / width) * 100}%` }}
            >
              <span className="font-mono font-semibold">{points[hover]}</span>{" "}
              <span className="text-muted-foreground">
                added · {weekLabel(hover)}
              </span>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

// ----------------------------------------------------------------- donut ---

const CAT_VARS = ["var(--cat-1)", "var(--cat-2)", "var(--cat-3)", "var(--cat-4)", "var(--cat-5)"];

export function SourceDonut({ slices }: { slices: { label: string; value: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);

  const size = 160;
  const radius = 62;
  const strokeWidth = 22;
  const circumference = 2 * Math.PI * radius;

  const fractions = slices.map((slice) => (total > 0 ? slice.value / total : 0));
  const arcs = fractions.map((fraction, index) => {
    const before = fractions.slice(0, index).reduce((sum, value) => sum + value, 0);
    return {
      index,
      fraction,
      dasharray: `${Math.max(fraction * circumference - 2, 0)} ${circumference}`,
      dashoffset: -before * circumference,
    };
  });

  const active = hover !== null ? slices[hover] : null;

  return (
    <Card className="animate-fade-up">
      <CardHeader>
        <CardTitle className="text-base">Candidates by source</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-5">
        <div className="relative shrink-0">
          <svg
            viewBox={`0 0 ${size} ${size}`}
            className="size-36 -rotate-90"
            role="img"
            aria-label="Candidates by acquisition source"
          >
            {arcs.map((arc) => (
              <circle
                key={arc.index}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={CAT_VARS[arc.index % CAT_VARS.length]}
                strokeWidth={hover === arc.index ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={arc.dasharray}
                strokeDashoffset={arc.dashoffset}
                className="transition-all duration-200"
                onMouseEnter={() => setHover(arc.index)}
                onMouseLeave={() => setHover(null)}
              />
            ))}
          </svg>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-2xl font-semibold">
              {active ? active.value : total}
            </span>
            <span className="text-muted-foreground max-w-20 truncate text-center text-[11px]">
              {active ? active.label : "candidates"}
            </span>
          </div>
        </div>
        <ul className="min-w-0 flex-1 space-y-1.5">
          {slices.map((slice, index) => (
            <li
              key={slice.label}
              className={cn(
                "flex cursor-default items-center gap-2 rounded-md px-1.5 py-1 text-sm transition-colors",
                hover === index && "bg-accent/60",
              )}
              onMouseEnter={() => setHover(index)}
              onMouseLeave={() => setHover(null)}
            >
              <span
                className="size-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: CAT_VARS[index % CAT_VARS.length] }}
              />
              <span className="text-muted-foreground min-w-0 flex-1 truncate">{slice.label}</span>
              <span className="font-mono text-xs font-semibold">
                {total > 0 ? Math.round((slice.value / total) * 100) : 0}%
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

// ------------------------------------------------------------------ bars ---

export function MonthlyPlacementsBars({
  months,
}: {
  months: { label: string; value: number; fees: number }[];
}) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(...months.map((month) => month.value), 1);

  const formatFees = (fees: number) =>
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      maximumFractionDigits: 0,
    }).format(fees);

  return (
    <Card className="animate-fade-up">
      <CardHeader className="flex flex-row items-baseline justify-between">
        <CardTitle className="text-base">Placements by month</CardTitle>
        <span className="text-muted-foreground text-xs">hover for fees</span>
      </CardHeader>
      <CardContent>
        <div className="flex h-44 items-end justify-around gap-3 px-2">
          {months.map((month, index) => (
            <div
              key={month.label}
              className="group flex h-full flex-1 cursor-default flex-col items-center justify-end gap-1.5"
              onMouseEnter={() => setHover(index)}
              onMouseLeave={() => setHover(null)}
            >
              {hover === index ? (
                <span className="bg-popover text-popover-foreground rounded-md border px-2 py-0.5 text-[11px] whitespace-nowrap shadow-sm">
                  {formatFees(month.fees)}
                </span>
              ) : (
                <span className="font-mono text-xs font-semibold">
                  {month.value > 0 ? month.value : ""}
                </span>
              )}
              <div
                className={cn(
                  "bg-primary w-full max-w-14 rounded-t-[4px] transition-all duration-300",
                  hover === index && "opacity-85",
                )}
                style={{
                  height: `${Math.max((month.value / max) * 100, month.value > 0 ? 8 : 2)}%`,
                  opacity: month.value === 0 ? 0.15 : undefined,
                }}
              />
              <span className="text-muted-foreground text-xs">{month.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
