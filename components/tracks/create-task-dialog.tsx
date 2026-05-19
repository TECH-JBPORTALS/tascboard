"use client";

import * as React from "react";
import { useMutation, useQuery } from "convex/react";
import { format, startOfDay } from "date-fns";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { authClient } from "@/lib/auth-client";
import { nextTaskCode } from "@/lib/track-utils";
import { taskStatusLabels, taskStatusOrder } from "@/lib/task-utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type CreateTaskDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: Doc<"tracks">;
  projectId: Id<"projects">;
  sprintId?: Id<"sprints">;
  defaultStatus?: Doc<"tasks">["status"];
};

export function CreateTaskDialog({
  open,
  onOpenChange,
  track,
  projectId,
  sprintId,
  defaultStatus = "backlog",
}: CreateTaskDialogProps) {
  const createTask = useMutation(api.task.create);
  const addToSprint = useMutation(api.sprint.addTask);
  const existingTasks = useQuery(api.task.listByTrack, { trackId: track._id });
  const { data: session } = authClient.useSession();

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [status, setStatus] =
    React.useState<Doc<"tasks">["status"]>(defaultStatus);
  const [priority, setPriority] =
    React.useState<Doc<"tasks">["priority"]>("medium");
  const [dueDate, setDueDate] = React.useState<Date>(() => new Date());
  const [dateOpen, setDateOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const userId = session?.user?.id ?? "unassigned";

  React.useEffect(() => {
    if (!open) {
      setTitle("");
      setDescription("");
      setStatus(defaultStatus);
      setPriority("medium");
      setDueDate(new Date());
      setError(null);
    }
  }, [open, defaultStatus]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setError("Title is required");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const codes = existingTasks?.map((t) => t.taskCode) ?? [];
      const due = startOfDay(dueDate).getTime();

      const taskId = await createTask({
        trackId: track._id,
        projectId,
        taskCode: nextTaskCode(track.trackCode, codes),
        title: trimmed,
        description: description.trim() || undefined,
        status,
        assignedTo: userId,
        assignedBy: userId,
        priority,
        complexity: "medium",
        startDate: Date.now(),
        endDate: due,
      });

      if (sprintId) {
        await addToSprint({ taskId, sprintId });
      }

      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>New task</DialogTitle>
            <DialogDescription>
              Add an issue to this track.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="task-title">Title</Label>
              <Input
                id="task-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title"
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="task-description">Description</Label>
              <Textarea
                id="task-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description…"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select
                  value={status}
                  onValueChange={(v) => setStatus(v as Doc<"tasks">["status"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {taskStatusOrder.map((s) => (
                      <SelectItem key={s} value={s}>
                        {taskStatusLabels[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Priority</Label>
                <Select
                  value={priority}
                  onValueChange={(v) =>
                    setPriority(v as Doc<"tasks">["priority"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Due date</Label>
              <Popover open={dateOpen} onOpenChange={setDateOpen}>
                <PopoverTrigger render={<Button type="button" variant="outline" className="justify-start" />}>
                  {format(dueDate, "MMM d, yyyy")}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={(date) => {
                      if (!date) return;
                      setDueDate(date);
                      setDateOpen(false);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating…" : "Create task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
