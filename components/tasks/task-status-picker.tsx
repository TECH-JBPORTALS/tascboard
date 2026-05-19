"use client";

import * as React from "react";
import type { Id } from "@/convex/_generated/dataModel";
import {
  taskStatusConfig,
  taskStatusOrder,
  type TaskStatus,
} from "@/lib/task-utils";
import { TaskCommandPopover } from "@/components/tasks/task-command-popover";
import { TaskStatusIcon } from "@/components/tasks/task-status-icon";
import { useTaskUpdate } from "@/components/tasks/use-task-update";
type TaskStatusPickerProps = {
  taskId: Id<"tasks">;
  value: TaskStatus;
  trigger: React.ReactElement;
  className?: string;
};

export function TaskStatusPicker({
  taskId,
  value,
  trigger,
  className,
}: TaskStatusPickerProps) {
  const [open, setOpen] = React.useState(false);
  const updateTask = useTaskUpdate(taskId);

  const options = taskStatusOrder.map((status) => {
    const config = taskStatusConfig[status];
    return {
      value: status,
      label: config.label,
      shortcut: config.shortcut,
      icon: <TaskStatusIcon status={status} className="size-3.5" />,
    };
  });

  return (
    <TaskCommandPopover
      open={open}
      onOpenChange={setOpen}
      trigger={trigger}
      placeholder="Change status…"
      shortcutKey="S"
      options={options}
      value={value}
      onSelect={(status) => {
        void updateTask({ status });
      }}
      className={className}
    />
  );
}
