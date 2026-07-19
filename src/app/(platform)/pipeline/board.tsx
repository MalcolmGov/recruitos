"use client";

import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { GripVertical, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { HiringStage } from "@/db/schema";
import { BOARD_STAGES, STAGE_LABELS } from "@/lib/ats";
import { cn } from "@/lib/utils";
import { addToPipeline, moveApplicationStage } from "@/server/ats-actions";

export type BoardApplication = {
  id: string;
  stage: HiringStage;
  candidate: { id: string; name: string; currentTitle: string | null };
};

function ApplicationCard({
  application,
  onMove,
}: {
  application: BoardApplication;
  onMove: (applicationId: string, stage: HiringStage) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: application.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={
        transform
          ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
          : undefined
      }
      className={cn(
        "bg-card rounded-lg border p-3 shadow-xs",
        isDragging && "z-50 opacity-80 shadow-md",
      )}
    >
      <div className="flex items-start justify-between gap-1">
        <div>
          <p className="text-sm font-medium">{application.candidate.name}</p>
          <p className="text-muted-foreground text-xs">
            {application.candidate.currentTitle ?? "—"}
          </p>
        </div>
        <div className="flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-6"
                aria-label="Move to stage"
              >
                <Plus className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Move to</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {BOARD_STAGES.filter((stage) => stage !== application.stage).map((stage) => (
                <DropdownMenuItem key={stage} onClick={() => onMove(application.id, stage)}>
                  {STAGE_LABELS[stage]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <button
            className="text-muted-foreground/60 hover:text-muted-foreground cursor-grab touch-none"
            aria-label="Drag card"
            {...listeners}
            {...attributes}
          >
            <GripVertical className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function StageColumn({
  stage,
  applications,
  onMove,
}: {
  stage: HiringStage;
  applications: BoardApplication[];
  onMove: (applicationId: string, stage: HiringStage) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "bg-secondary/50 flex w-64 shrink-0 flex-col gap-2 rounded-xl border p-3",
        isOver && "ring-primary ring-2",
        stage === "rejected" && "opacity-70",
      )}
    >
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold">{STAGE_LABELS[stage]}</h3>
        <Badge variant="secondary">{applications.length}</Badge>
      </div>
      <div className="flex min-h-24 flex-col gap-2">
        {applications.map((application) => (
          <ApplicationCard key={application.id} application={application} onMove={onMove} />
        ))}
      </div>
    </div>
  );
}

export function PipelineBoard({
  jobId,
  applications,
  availableCandidates,
}: {
  jobId: string;
  applications: BoardApplication[];
  availableCandidates: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [addOpen, setAddOpen] = useState(false);
  const [candidateId, setCandidateId] = useState("");
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  function move(applicationId: string, stage: HiringStage) {
    startTransition(async () => {
      const result = await moveApplicationStage({ applicationId, stage });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (stage === "placed") toast.success("Placed! A placement record was created.");
      router.refresh();
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const stage = event.over?.id as HiringStage | undefined;
    const applicationId = String(event.active.id);
    if (!stage) return;
    const current = applications.find((a) => a.id === applicationId);
    if (!current || current.stage === stage) return;
    move(applicationId, stage);
  }

  async function handleAdd() {
    if (!candidateId) return;
    const result = await addToPipeline({ jobId, candidateId });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Candidate added to pipeline");
    setAddOpen(false);
    setCandidateId("");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" disabled={availableCandidates.length === 0}>
              <Plus className="size-4" /> Add candidate
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Add candidate to pipeline</DialogTitle>
              <DialogDescription>Starts at the Applied stage.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Candidate</Label>
                <Select value={candidateId} onValueChange={setCandidateId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select candidate" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCandidates.map((candidate) => (
                      <SelectItem key={candidate.id} value={candidate.id}>
                        {candidate.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={handleAdd} disabled={!candidateId}>
                Add to pipeline
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <ScrollArea className="w-full pb-3">
          <div className="flex gap-3">
            {BOARD_STAGES.map((stage) => (
              <StageColumn
                key={stage}
                stage={stage}
                applications={applications.filter((a) => a.stage === stage)}
                onMove={move}
              />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </DndContext>
    </div>
  );
}
