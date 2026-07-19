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
import { Textarea } from "@/components/ui/textarea";
import { saveJob } from "@/server/ats-actions";

export type JobFormValues = {
  id?: string;
  title?: string;
  clientCompanyId?: string | null;
  description?: string | null;
  type?: "permanent" | "contract";
  workMode?: "remote" | "hybrid" | "onsite";
  location?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  currency?: string;
  status?: "draft" | "open" | "closed" | "filled";
  published?: boolean;
  tags?: string[];
};

export function JobFormSheet({
  clients,
  initial,
  trigger,
}: {
  clients: { id: string; name: string }[];
  initial?: JobFormValues;
  trigger?: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [clientCompanyId, setClientCompanyId] = useState(initial?.clientCompanyId ?? "");
  const [type, setType] = useState(initial?.type ?? "permanent");
  const [workMode, setWorkMode] = useState(initial?.workMode ?? "remote");
  const [currency, setCurrency] = useState(initial?.currency ?? "GBP");
  const [status, setStatus] = useState(initial?.status ?? "draft");
  const [published, setPublished] = useState(initial?.published ?? false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setSaving(true);
    const result = await saveJob(
      {
        title: data.get("title"),
        clientCompanyId,
        description: data.get("description"),
        type,
        workMode,
        location: data.get("location"),
        salaryMin: data.get("salaryMin") || "",
        salaryMax: data.get("salaryMax") || "",
        currency,
        status,
        published,
        tags: data.get("tags"),
      },
      initial?.id,
    );
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(initial?.id ? "Job updated" : "Job created");
    setOpen(false);
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="size-4" /> New job
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{initial?.id ? "Edit job" : "New job"}</SheetTitle>
          <SheetDescription>
            Published open jobs appear on the public job board.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 px-4 pb-6">
          <div className="space-y-2">
            <Label htmlFor="job-title">Title</Label>
            <Input id="job-title" name="title" required defaultValue={initial?.title ?? ""} />
          </div>
          <div className="space-y-2">
            <Label>Client</Label>
            <Select value={clientCompanyId} onValueChange={setClientCompanyId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="permanent">Permanent</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Work mode</Label>
              <Select value={workMode} onValueChange={(v) => setWorkMode(v as typeof workMode)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="onsite">Onsite</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="job-location">Location</Label>
            <Input id="job-location" name="location" defaultValue={initial?.location ?? ""} />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="job-salary-min">
                {type === "contract" ? "Rate min" : "Salary min"}
              </Label>
              <Input
                id="job-salary-min"
                name="salaryMin"
                type="number"
                min={0}
                defaultValue={initial?.salaryMin ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="job-salary-max">
                {type === "contract" ? "Rate max" : "Salary max"}
              </Label>
              <Input
                id="job-salary-max"
                name="salaryMax"
                type="number"
                min={0}
                defaultValue={initial?.salaryMax ?? ""}
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
          </div>
          <div className="space-y-2">
            <Label htmlFor="job-tags">Tags (comma-separated)</Label>
            <Input
              id="job-tags"
              name="tags"
              defaultValue={initial?.tags?.join(", ") ?? ""}
              placeholder="React, TypeScript"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="job-description">Description</Label>
            <Textarea
              id="job-description"
              name="description"
              rows={5}
              defaultValue={initial?.description ?? ""}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="filled">Filled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2 pb-1">
              <Checkbox
                id="job-published"
                checked={published}
                onCheckedChange={(checked) => setPublished(checked === true)}
              />
              <Label htmlFor="job-published" className="font-normal">
                Publish to job board
              </Label>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? "Saving…" : initial?.id ? "Save changes" : "Create job"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
