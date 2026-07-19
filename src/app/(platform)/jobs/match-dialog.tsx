"use client";

import { Plus, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { addToPipeline } from "@/server/ats-actions";
import { matchCandidatesToJob, type MatchRow } from "@/server/ai/match";

function scoreColor(score: number) {
  if (score >= 75) return "text-success";
  if (score >= 50) return "text-warning";
  return "text-muted-foreground";
}

const fitLabels: Array<[keyof Omit<MatchRow["breakdown"], "pros" | "cons">, string]> = [
  ["skillsFit", "Skills"],
  ["experienceFit", "Experience"],
  ["salaryFit", "Salary"],
  ["locationFit", "Location"],
  ["availabilityFit", "Availability"],
];

export function MatchDialog({ jobId, jobTitle }: { jobId: string; jobTitle: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<MatchRow[] | null>(null);
  const [adding, setAdding] = useState<string | null>(null);

  async function runMatch() {
    setLoading(true);
    const result = await matchCandidatesToJob(jobId);
    setLoading(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setMatches(result.matches);
  }

  async function add(candidateId: string) {
    setAdding(candidateId);
    const result = await addToPipeline({ jobId, candidateId });
    setAdding(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Added to pipeline");
    setMatches((current) => current?.filter((m) => m.candidateId !== candidateId) ?? null);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`AI match for ${jobTitle}`}>
          <Sparkles className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>AI matching — {jobTitle}</DialogTitle>
          <DialogDescription>
            Scores your active talent pool against this role, with the reasoning shown. You
            decide who enters the pipeline.
          </DialogDescription>
        </DialogHeader>

        {matches === null ? (
          <div className="py-8 text-center">
            <Button onClick={runMatch} disabled={loading}>
              <Sparkles className="size-4" />
              {loading ? "Scoring candidates…" : "Run AI matching"}
            </Button>
          </div>
        ) : matches.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            No candidates left to add — everyone matched is already in the pipeline.
          </p>
        ) : (
          <div className="space-y-3">
            {matches.map((match) => (
              <Card key={match.candidateId}>
                <CardContent className="space-y-3 pt-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{match.candidateName}</p>
                      <p className="text-muted-foreground text-xs">
                        {match.currentTitle ?? "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-mono text-2xl font-semibold ${scoreColor(match.score)}`}>
                        {match.score}%
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={adding === match.candidateId}
                        onClick={() => add(match.candidateId)}
                      >
                        <Plus className="size-3.5" /> Pipeline
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {fitLabels.map(([key, label]) => (
                      <Badge key={key} variant="secondary" className="font-normal">
                        {label} {match.breakdown[key]}
                      </Badge>
                    ))}
                  </div>

                  <p className="text-sm">{match.explanation}</p>

                  <div className="grid gap-2 text-xs sm:grid-cols-2">
                    <ul className="space-y-1">
                      {match.breakdown.pros.map((pro) => (
                        <li key={pro} className="text-success">
                          + {pro}
                        </li>
                      ))}
                    </ul>
                    <ul className="space-y-1">
                      {match.breakdown.cons.map((con) => (
                        <li key={con} className="text-muted-foreground">
                          − {con}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
