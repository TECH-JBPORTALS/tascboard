"use client";

import * as React from "react";
import { RiAddLine, RiPlayFill } from "@remixicon/react";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { taskStatusLabels, type TaskStatus } from "@/lib/task-utils";
import { TaskIssueRow } from "@/components/tasks/TaskIssueRow";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { TaskStatusIcon } from "../tasks/TaskStatusPicker";

type TrackStatusGroupProps = {
  status: TaskStatus;
  tasks: Doc<"tasks">[];
  track: Doc<"tracks">;
  projectId: Id<"projects">;
};

export function TrackStatusGroup({
  status,
  tasks,
  track,
  projectId,
}: TrackStatusGroupProps) {
  const [createOpen, setCreateOpen] = React.useState(false);
  const label = taskStatusLabels[status];

  return (
    <Collapsible
      defaultOpen
      className="border-b border-border/60 last:border-b-0"
    >
      <div className="flex h-9 items-center gap-2 bg-muted/30 px-2">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 text-left text-sm">
          <CollapsibleTrigger
            className="group"
            render={<Button variant={"ghost"} size={"icon-xs"} />}
          >
            <RiPlayFill className="size-3 shrink-0 group-hover:text-foreground text-muted-foreground transition-transform duration-200 group-data-panel-open:rotate-90" />
          </CollapsibleTrigger>
          <TaskStatusIcon status={status} />
          <span className="font-medium">{label}</span>
          <span className="text-xs tabular-nums text-muted-foreground">
            {tasks.length}
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="shrink-0 text-muted-foreground"
          onClick={() => setCreateOpen(true)}
          aria-label={`Add issue to ${label}`}
        >
          <RiAddLine className="size-4" />
        </Button>
      </div>

      <CollapsibleContent>
        {tasks.map((task) => (
          <TaskIssueRow key={task._id} task={task} />
        ))}
      </CollapsibleContent>

      <CreateTaskDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        track={track}
        projectId={projectId}
        defaultStatus={status}
      />
    </Collapsible>
  );
}
