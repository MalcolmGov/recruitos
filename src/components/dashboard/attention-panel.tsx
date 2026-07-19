import { ArrowRight, CircleAlert, Eye, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Insight } from "@/server/dashboard";
import { cn } from "@/lib/utils";

/**
 * "What needs my attention" — the five-second rule. Rule-based insights with
 * one concrete next action each; the copilot handles the open-ended asks.
 */
export function AttentionPanel({ insights }: { insights: Insight[] }) {
  return (
    <Card className="animate-fade-up h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          Needs your attention
          {insights.length > 0 ? <Badge variant="secondary">{insights.length}</Badge> : null}
        </CardTitle>
        <span className="gradient-ai flex size-6 items-center justify-center rounded-lg text-white">
          <Sparkles className="size-3.5" />
        </span>
      </CardHeader>
      <CardContent>
        {insights.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm font-medium">All clear</p>
            <p className="text-muted-foreground mt-1 text-xs">
              No stalled candidates, empty pipelines or waiting offers.
            </p>
          </div>
        ) : (
          <ul className="space-y-1">
            {insights.map((insight, index) => (
              <li key={`${index}-${insight.title}`}>
                <Link
                  href={insight.href}
                  className="group hover:bg-accent/60 -mx-2 flex items-start gap-3 rounded-lg px-2 py-2.5 transition-colors"
                >
                  <span
                    className={cn(
                      "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg",
                      insight.severity === "action"
                        ? "bg-warning/15 text-[oklch(0.55_0.14_70)] dark:text-warning"
                        : "bg-primary/10 text-primary",
                    )}
                  >
                    {insight.severity === "action" ? (
                      <CircleAlert className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{insight.title}</span>
                    <span className="text-muted-foreground block text-xs leading-relaxed">
                      {insight.detail}
                    </span>
                  </span>
                  <span className="text-primary mt-1 flex shrink-0 items-center gap-0.5 text-xs font-medium opacity-0 transition-opacity group-hover:opacity-100">
                    {insight.cta}
                    <ArrowRight className="size-3" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link
          href="/pipeline"
          className="text-primary mt-3 flex items-center gap-1 text-xs font-medium hover:underline"
        >
          View pipeline <ArrowRight className="size-3" />
        </Link>
      </CardContent>
    </Card>
  );
}
