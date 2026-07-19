import { BarChart3, Clock, LineChart, PieChart, Trophy, Wallet } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireTenant } from "@/lib/session";

export const metadata = { title: "Reports" };

/**
 * Reports preview: the analytics catalog with a designed pre-launch state.
 * Full reporting lands with more data history; the dashboard already carries
 * live KPIs, the funnel and the attention feed.
 */
const upcoming = [
  { icon: Clock, title: "Time to hire", detail: "Stage-by-stage velocity per job and client." },
  { icon: Trophy, title: "Recruiter leaderboard", detail: "Placements, fees and pipeline touch per consultant." },
  { icon: Wallet, title: "Revenue & forecast", detail: "Fees billed (GBP) and internal reporting (ZAR)." },
  { icon: PieChart, title: "Source performance", detail: "Which channels produce placements, not just applicants." },
  { icon: LineChart, title: "Pipeline health", detail: "Conversion and drop-off by stage over time." },
];

export default async function ReportsPage() {
  await requireTenant();

  return (
    <div className="space-y-8">
      <div className="animate-fade-up flex flex-col items-center pt-8 text-center">
        <span className="gradient-primary flex size-14 items-center justify-center rounded-2xl text-white shadow-glow">
          <BarChart3 className="size-7" />
        </span>
        <h2 className="mt-5 text-2xl font-semibold tracking-tight">Reports</h2>
        <p className="text-muted-foreground mt-2 max-w-md text-sm">
          Deep analytics switch on as your data history grows. Today&apos;s live numbers are
          already on your dashboard — and the copilot can answer ad-hoc questions now.
        </p>
        <div className="mt-5 flex gap-2">
          <Button asChild>
            <Link href="/dashboard">Open dashboard</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/billing">See your plan</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {upcoming.map((report) => (
          <Card key={report.title} className="animate-fade-up">
            <CardContent className="flex items-start gap-3 pt-5">
              <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-xl">
                <report.icon className="size-4.5" />
              </span>
              <span>
                <span className="flex items-center gap-2 text-sm font-semibold">
                  {report.title}
                  <Badge variant="secondary" className="font-normal">
                    Coming soon
                  </Badge>
                </span>
                <span className="text-muted-foreground mt-1 block text-xs leading-relaxed">
                  {report.detail}
                </span>
              </span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
