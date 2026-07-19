"use client";

import { FileUp, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveCandidate } from "@/server/ats-actions";
import { parseCv, type ParsedCv } from "@/server/ai/cv-parse";

export function ImportCvDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState<ParsedCv | null>(null);
  const [consent, setConsent] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const data = new FormData();
    data.append("cv", file);
    setParsing(true);
    const result = await parseCv(data);
    setParsing(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setParsed(result.parsed);
    toast.success("CV parsed — review before saving");
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!parsed) return;
    const data = new FormData(event.currentTarget);
    setSaving(true);
    const result = await saveCandidate({
      name: data.get("name"),
      email: data.get("email"),
      phone: data.get("phone"),
      location: data.get("location"),
      currentTitle: data.get("currentTitle"),
      skills: data.get("skills"),
      salaryExpectation: data.get("salaryExpectation") || "",
      currency: "GBP",
      ukWorkEligibility: "remote_no_visa",
      noticePeriod: data.get("noticePeriod"),
      source: "CV import (AI parsed)",
      consent,
    });
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Candidate created from CV");
    setOpen(false);
    setParsed(null);
    setConsent(false);
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setParsed(null);
          setConsent(false);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <Sparkles className="size-4" /> Import CV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import candidate from CV</DialogTitle>
          <DialogDescription>
            AI extracts the profile; you review every field before anything is saved.
          </DialogDescription>
        </DialogHeader>

        {!parsed ? (
          <label className="border-muted-foreground/25 hover:bg-accent/50 flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors">
            <FileUp className="text-muted-foreground size-8" />
            <span className="text-sm font-medium">
              {parsing ? "Parsing with AI…" : "Choose a CV (PDF or .txt)"}
            </span>
            <span className="text-muted-foreground text-xs">Max 10 MB</span>
            <input
              type="file"
              accept=".pdf,.txt,text/plain,application/pdf"
              className="hidden"
              disabled={parsing}
              onChange={handleFile}
            />
          </label>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <p className="bg-accent text-accent-foreground rounded-lg p-3 text-sm">
              {parsed.summary}
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cv-name">Full name</Label>
                <Input id="cv-name" name="name" required defaultValue={parsed.name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cv-email">Email</Label>
                <Input id="cv-email" name="email" type="email" required defaultValue={parsed.email} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cv-phone">Phone</Label>
                <Input id="cv-phone" name="phone" defaultValue={parsed.phone ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cv-location">Location</Label>
                <Input id="cv-location" name="location" defaultValue={parsed.location ?? ""} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cv-title">Current title</Label>
                <Input id="cv-title" name="currentTitle" defaultValue={parsed.currentTitle ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cv-notice">Notice period</Label>
                <Input id="cv-notice" name="noticePeriod" defaultValue={parsed.noticePeriod ?? ""} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cv-skills">Skills (comma-separated)</Label>
              <Textarea
                id="cv-skills"
                name="skills"
                rows={2}
                defaultValue={parsed.skills.join(", ")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cv-salary">Salary expectation (GBP, optional)</Label>
              <Input
                id="cv-salary"
                name="salaryExpectation"
                type="number"
                min={0}
                defaultValue={parsed.salaryExpectation ?? ""}
              />
            </div>
            <div className="flex items-start gap-2">
              <Checkbox
                id="cv-consent"
                checked={consent}
                onCheckedChange={(checked) => setConsent(checked === true)}
              />
              <Label htmlFor="cv-consent" className="text-muted-foreground font-normal">
                The candidate has consented to their data being processed for recruitment
                purposes.
              </Label>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setParsed(null)}
              >
                Parse another
              </Button>
              <Button type="submit" className="flex-1" disabled={saving || !consent}>
                {saving ? "Saving…" : "Create candidate"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
