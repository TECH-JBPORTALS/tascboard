"use client";

import { format } from "date-fns";
import type { Doc } from "@/convex/_generated/dataModel";
import { initialsFromId } from "@/lib/track-utils";
import { TaskDueDatePicker } from "@/components/tasks/task-due-date-picker";
import { TaskPriorityPicker } from "@/components/tasks/task-priority-picker";
import { TaskPriorityIcon } from "@/components/tasks/task-priority-icon";
import { TaskStatusPicker } from "@/components/tasks/task-status-picker";
import { TaskStatusIcon } from "@/components/tasks/task-status-icon";
import { cn } from "@/lib/utils";

type TaskIssueRowProps = {
  task: Doc<"tasks">;
  className?: string;
};

function RowTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-sm outline-none hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function TaskIssueRow({ task, className }: TaskIssueRowProps) {
  return (
    <div
      className={cn(
        "group flex h-9 items-center gap-2 px-3 text-sm hover:bg-muted/40",
        className,
      )}
    >
      <TaskPriorityPicker
        taskId={task._id}
        value={task.priority}
        trigger={
          <RowTrigger className="size-6" aria-label="Change priority">
            <TaskPriorityIcon priority={task.priority} />
          </RowTrigger>
        }
      />

      <span className="w-18 shrink-0 truncate font-mono text-xs text-muted-foreground">
        {task.taskCode}
      </span>

      <TaskStatusPicker
        taskId={task._id}
        value={task.status}
        trigger={
          <RowTrigger className="size-6" aria-label="Change status">
            <TaskStatusIcon status={task.status} className="size-4" />
          </RowTrigger>
        }
      />

      <span className="min-w-0 flex-1 truncate">{task.title}</span>

      <TaskDueDatePicker
        taskId={task._id}
        endDate={task.endDate}
        startDate={task.startDate}
        trigger={
          <RowTrigger
            className="hidden h-6 gap-1 px-1.5 text-xs text-muted-foreground sm:inline-flex"
            aria-label="Change due date"
          >
            {format(task.endDate, "MMM d")}
          </RowTrigger>
        }
      />

      <span
        className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground"
        title={task.assignedTo}
      >
        {initialsFromId(task.assignedTo)}
      </span>

      <span className="hidden w-14 shrink-0 text-right text-xs text-muted-foreground md:inline">
        {format(task.createdAt, "MMM d")}
      </span>
    </div>
  );
}
