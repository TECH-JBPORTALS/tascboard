"use client";

import { format } from "date-fns";
import Link from "next/link";
import { RiCalendarLine, RiStackLine, RiUserLine } from "@remixicon/react";
import type { Doc } from "@/convex/_generated/dataModel";
import { TaskDueDatePicker } from "@/components/tasks/TaskDueDatePicker";
import { TaskLabelPicker } from "@/components/tasks/TaskLabelPicker";
import {
  TaskPriorityIcon,
  TaskPriorityPicker,
} from "@/components/tasks/TaskPriorityPicker";
import {
  TaskStatusIcon,
  TaskStatusPicker,
} from "@/components/tasks/TaskStatusPicker";
import { taskPriorityConfig, taskStatusConfig } from "@/lib/task-utils";
import { initialsFromId } from "@/lib/track-utils";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TaskDetailSidebarProps = {
  orgSlug: string;
  task: Doc<"tasks">;
  project: Doc<"projects">;
  labels: Doc<"labels">[];
};

function SidebarRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-8 items-start gap-3 text-sm">
      <span className="w-20 shrink-0 pt-1 text-muted-foreground">{label}</span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function PropertyChip({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn(
        "h-7 w-full justify-start gap-1.5 rounded-md border-border/80 bg-muted/30 px-2.5 font-normal shadow-none",
        className,
      )}
      {...props}
    >
      {children}
    </Button>
  );
}

export function TaskDetailSidebar({
  orgSlug,
  task,
  project,
  labels,
}: TaskDetailSidebarProps) {
  const statusLabel = taskStatusConfig[task.status].label;
  const priorityLabel = taskPriorityConfig[task.priority].label;

  return (
    <aside className="w-full shrink-0 space-y-6 border-l border-border/60 bg-muted/10 p-4 lg:w-72">
      <SidebarRow label="Status">
        <TaskStatusPicker
          taskId={task._id}
          value={task.status}
          trigger={
            <PropertyChip>
              <TaskStatusIcon status={task.status} className="size-3.5" />
              <span>{statusLabel}</span>
            </PropertyChip>
          }
        />
      </SidebarRow>

      <SidebarRow label="Priority">
        <TaskPriorityPicker
          taskId={task._id}
          value={task.priority}
          trigger={
            <PropertyChip>
              <TaskPriorityIcon priority={task.priority} />
              <span>{priorityLabel}</span>
            </PropertyChip>
          }
        />
      </SidebarRow>

      <SidebarRow label="Assignee">
        <PropertyChip className="text-muted-foreground" disabled>
          <RiUserLine className="size-3.5" />
          <span className="truncate">{initialsFromId(task.assignedTo)}</span>
        </PropertyChip>
      </SidebarRow>

      <SidebarRow label="Due date">
        <TaskDueDatePicker
          taskId={task._id}
          endDate={task.endDate}
          startDate={task.startDate}
          align="end"
          trigger={
            <PropertyChip>
              <RiCalendarLine className="size-3.5" />
              <span>{format(task.endDate, "dd/MM/yyyy")}</span>
            </PropertyChip>
          }
        />
      </SidebarRow>

      <div className="space-y-2">
        <TaskLabelPicker
          taskId={task._id}
          projectId={project._id}
          projectName={project.name}
          attachedLabels={labels}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <RiStackLine className="size-3.5" />
          <span>Project</span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 w-full justify-start gap-1.5 font-normal"
          render={<Link href={`/${orgSlug}/pro/${project._id}`} />}
          nativeButton={false}
        >
          {project.name}
        </Button>
      </div>
    </aside>
  );
}
