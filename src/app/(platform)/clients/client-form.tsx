"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
import { saveClient } from "@/server/ats-actions";

export type ClientFormValues = {
  id?: string;
  name?: string;
  website?: string | null;
  industry?: string | null;
  location?: string | null;
  status?: "prospect" | "active" | "dormant";
  notes?: string | null;
};

export function ClientFormSheet({
  initial,
  trigger,
}: {
  initial?: ClientFormValues;
  trigger?: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<string>(initial?.status ?? "active");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setSaving(true);
    const result = await saveClient(
      {
        name: data.get("name"),
        website: data.get("website"),
        industry: data.get("industry"),
        location: data.get("location"),
        status,
        notes: data.get("notes"),
      },
      initial?.id,
    );
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(initial?.id ? "Client updated" : "Client created");
    setOpen(false);
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="size-4" /> New client
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{initial?.id ? "Edit client" : "New client"}</SheetTitle>
          <SheetDescription>UK employer account for this tenant.</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 px-4 pb-6">
          <div className="space-y-2">
            <Label htmlFor="client-name">Company name</Label>
            <Input id="client-name" name="name" required defaultValue={initial?.name ?? ""} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="client-industry">Industry</Label>
              <Input id="client-industry" name="industry" defaultValue={initial?.industry ?? ""} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prospect">Prospect</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="dormant">Dormant</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-location">Location</Label>
            <Input id="client-location" name="location" defaultValue={initial?.location ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-website">Website</Label>
            <Input id="client-website" name="website" defaultValue={initial?.website ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-notes">Notes</Label>
            <Textarea id="client-notes" name="notes" rows={4} defaultValue={initial?.notes ?? ""} />
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? "Saving…" : initial?.id ? "Save changes" : "Create client"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
