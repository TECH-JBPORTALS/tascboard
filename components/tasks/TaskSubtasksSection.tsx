"use client";

import * as React from "react";
import { useMutation, useQuery } from "convex/react";
import {
  RiAddLine,
  RiCheckboxBlankCircleLine,
  RiCheckboxCircleFill,
  RiDeleteBinLine,
} from "@remixicon/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useActor } from "@/hooks/use-actor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type TaskSubtasksSectionProps = {
  taskId: Id<"tasks">;
};

export function TaskSubtasksSection({ taskId }: TaskSubtasksSectionProps) {
  const subtasks = useQuery(api.subtask.listByTask, { taskId });
  const createSubtask = useMutation(api.subtask.create);
  const toggleSubtask = useMutation(api.subtask.toggle);
  const removeSubtask = useMutation(api.subtask.remove);
  const { deviceName } = useActor();

  const [draft, setDraft] = React.useState("");
  const [adding, setAdding] = React.useState(false);
  const total = subtasks?.length ?? 0;
  const completed =
    subtasks?.filter((subtask) => subtask.completed).length ?? 0;
  const progress = total === 0 ? 0 : (completed / total) * 100;

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) return;

    setAdding(true);
    try {
      await createSubtask({ taskId, title: trimmed, deviceName });
      setDraft("");
    } finally {
      setAdding(false);
    }
  }

  return (
    <section className="space-y-3">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xs font-medium text-muted-foreground">
            Sub tasks
          </h3>
          <span className="rounded-full border border-border/70 bg-muted/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            {completed}/{total}
          </span>
        </div>
        {total > 0 && <Progress value={progress} className="gap-1" />}
      </div>

      {subtasks === undefined ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <>
          {subtasks.length > 0 ? (
            <ul className="space-y-1">
              {subtasks.map((subtask) => (
                <li
                  key={subtask._id}
                  className="group flex h-9 items-center gap-2 rounded-md px-2 hover:bg-muted/40"
                >
                  <button
                    type="button"
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                    onClick={() =>
                      void toggleSubtask({ subtaskId: subtask._id, deviceName })
                    }
                    aria-label={
                      subtask.completed ? "Mark incomplete" : "Mark complete"
                    }
                  >
                    {subtask.completed ? (
                      <RiCheckboxCircleFill className="size-4 text-blue-500" />
                    ) : (
                      <RiCheckboxBlankCircleLine className="size-4" />
                    )}
                  </button>
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate text-sm",
                      subtask.completed && "text-muted-foreground line-through",
                    )}
                  >
                    {subtask.title}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="size-7 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() =>
                      void removeSubtask({ subtaskId: subtask._id, deviceName })
                    }
                    aria-label="Remove sub-task"
                  >
                    <RiDeleteBinLine className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No sub-tasks yet.</p>
          )}

          <form
            onSubmit={handleAdd}
            className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/20 px-2 py-1.5"
          >
            <RiAddLine className="size-4 shrink-0 text-muted-foreground" />
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Add sub-task"
              className="h-8 border-0 bg-transparent! px-0 shadow-none focus-visible:ring-0"
            />
            <Button type="submit" size="sm" disabled={adding || !draft.trim()}>
              Add
            </Button>
          </form>
        </>
      )}
    </section>
  );
}
