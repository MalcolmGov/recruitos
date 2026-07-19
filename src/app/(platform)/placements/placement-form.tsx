"use client";

import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updatePlacement } from "@/server/ats-actions";

export function PlacementEditDialog({
  placement,
}: {
  placement: {
    id: string;
    status: "pending_start" | "active" | "completed" | "terminated";
    startDate: Date | null;
    salary: number | null;
    fee: number | null;
    candidateName: string;
  };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<string>(placement.status);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setSaving(true);
    const result = await updatePlacement({
      placementId: placement.id,
      status,
      startDate: data.get("startDate") || "",
      salary: data.get("salary") || "",
      fee: data.get("fee") || "",
    });
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Placement updated");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Edit placement`}>
          <Pencil className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit placement</DialogTitle>
          <DialogDescription>{placement.candidateName}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending_start">Pending start</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="terminated">Terminated</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pl-start">Start date</Label>
            <Input
              id="pl-start"
              name="startDate"
              type="date"
              defaultValue={placement.startDate?.toISOString().slice(0, 10) ?? ""}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pl-salary">Salary / rate</Label>
              <Input
                id="pl-salary"
                name="salary"
                type="number"
                min={0}
                defaultValue={placement.salary ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pl-fee">Fee (GBP)</Label>
              <Input id="pl-fee" name="fee" type="number" min={0} defaultValue={placement.fee ?? ""} />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
