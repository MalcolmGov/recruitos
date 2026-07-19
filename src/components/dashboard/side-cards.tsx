import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** "2h ago"-style relative time for the activity timeline. */
export function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export type ActivityEntry = {
  id: string;
  actorName: string;
  text: string;
  createdAt: Date;
};

export function ActivityTimeline({ entries }: { entries: ActivityEntry[] }) {
  return (
    <Card className="animate-fade-up h-full">
      <CardHeader className="flex flex-row items-baseline justify-between">
        <CardTitle className="text-base">Recent activity</CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            Activity from your team lands here.
          </p>
        ) : (
          <ul className="relative space-y-4">
            <span
              aria-hidden
              className="bg-border absolute top-2 bottom-2 left-[13px] w-px"
            />
            {entries.map((entry) => (
              <li key={entry.id} className="relative flex items-start gap-3">
                <Avatar className="ring-card z-10 size-7 ring-2">
                  <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                    {initials(entry.actorName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="truncate text-sm">
                    <span className="font-medium">{entry.actorName}</span>{" "}
                    <span className="text-muted-foreground">{entry.text}</span>
                  </p>
                </div>
                <span className="text-muted-foreground shrink-0 pt-1 font-mono text-[11px]">
                  {timeAgo(entry.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function TopJobs({
  jobs,
}: {
  jobs: { id: string; title: string; status: string; applications: number }[];
}) {
  return (
    <Card className="animate-fade-up h-full">
      <CardHeader className="flex flex-row items-baseline justify-between">
        <CardTitle className="text-base">Top performing jobs</CardTitle>
        <span className="text-muted-foreground text-xs">by applications</span>
      </CardHeader>
      <CardContent className="flex h-full flex-col">
        {jobs.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            Open a job and applications rank here.
          </p>
        ) : (
          <ul className="space-y-2.5">
            {jobs.map((job) => (
              <li key={job.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 flex-1 truncate">{job.title}</span>
                {job.status === "filled" ? (
                  <Badge variant="outline" className="shrink-0 font-normal">
                    filled
                  </Badge>
                ) : null}
                <span className="font-mono text-sm font-semibold">{job.applications}</span>
              </li>
            ))}
          </ul>
        )}
        <Link
          href="/jobs"
          className="text-primary mt-auto flex items-center gap-1 pt-4 text-xs font-medium hover:underline"
        >
          View all jobs <ArrowRight className="size-3" />
        </Link>
      </CardContent>
    </Card>
  );
}
