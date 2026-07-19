"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { saveCandidate } from "@/server/ats-actions";

export type CandidateFormValues = {
  id?: string;
  name?: string;
  email?: string;
  phone?: string | null;
  location?: string | null;
  currentTitle?: string | null;
  skills?: string[];
  salaryExpectation?: number | null;
  currency?: string;
  ukWorkEligibility?: "remote_no_visa" | "visa_held" | "visa_required" | "uk_citizen";
  noticePeriod?: string | null;
  source?: string | null;
};

const eligibilityLabels = {
  remote_no_visa: "Remote — no visa needed",
  visa_held: "UK visa held",
  visa_required: "UK visa required",
  uk_citizen: "UK citizen",
} as const;

export function CandidateFormSheet({
  initial,
  trigger,
}: {
  initial?: CandidateFormValues;
  trigger?: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [currency, setCurrency] = useState(initial?.currency ?? "GBP");
  const [eligibility, setEligibility] = useState(
    initial?.ukWorkEligibility ?? "remote_no_visa",
  );
  const [consent, setConsent] = useState(Boolean(initial?.id));
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setSaving(true);
    const result = await saveCandidate(
      {
        name: data.get("name"),
        email: data.get("email"),
        phone: data.get("phone"),
        location: data.get("location"),
        currentTitle: data.get("currentTitle"),
        skills: data.get("skills"),
        salaryExpectation: data.get("salaryExpectation") || "",
        currency,
        ukWorkEligibility: eligibility,
        noticePeriod: data.get("noticePeriod"),
        source: data.get("source"),
        consent,
      },
      initial?.id,
    );
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(initial?.id ? "Candidate updated" : "Candidate added");
    setOpen(false);
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="size-4" /> New candidate
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{initial?.id ? "Edit candidate" : "New candidate"}</SheetTitle>
          <SheetDescription>
            Profiles are tenant-scoped and consent-tracked (POPIA/GDPR).
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 px-4 pb-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cand-name">Full name</Label>
              <Input id="cand-name" name="name" required defaultValue={initial?.name ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cand-email">Email</Label>
              <Input
                id="cand-email"
                name="email"
                type="email"
                required
                defaultValue={initial?.email ?? ""}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cand-phone">Phone</Label>
              <Input id="cand-phone" name="phone" defaultValue={initial?.phone ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cand-location">Location</Label>
              <Input id="cand-location" name="location" defaultValue={initial?.location ?? ""} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cand-title">Current title</Label>
            <Input id="cand-title" name="currentTitle" defaultValue={initial?.currentTitle ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cand-skills">Skills (comma-separated)</Label>
            <Input
              id="cand-skills"
              name="skills"
              defaultValue={initial?.skills?.join(", ") ?? ""}
              placeholder="React, TypeScript, GraphQL"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="cand-salary">Salary expectation</Label>
              <Input
                id="cand-salary"
                name="salaryExpectation"
                type="number"
                min={0}
                defaultValue={initial?.salaryExpectation ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="ZAR">ZAR</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cand-notice">Notice period</Label>
              <Input id="cand-notice" name="noticePeriod" defaultValue={initial?.noticePeriod ?? ""} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>UK work eligibility</Label>
              <Select
                value={eligibility}
                onValueChange={(v) => setEligibility(v as typeof eligibility)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(eligibilityLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cand-source">Source</Label>
              <Input
                id="cand-source"
                name="source"
                defaultValue={initial?.source ?? ""}
                placeholder="LinkedIn, referral…"
              />
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Checkbox
              id="cand-consent"
              checked={consent}
              onCheckedChange={(checked) => setConsent(checked === true)}
            />
            <Label htmlFor="cand-consent" className="text-muted-foreground font-normal">
              The candidate has consented to their data being processed for recruitment
              purposes.
            </Label>
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? "Saving…" : initial?.id ? "Save changes" : "Add candidate"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
