"use client";

import * as React from "react";
import type { Id } from "@/convex/_generated/dataModel";
import {
  taskPriorityConfig,
  taskPriorityOrder,
  type TaskPriority,
} from "@/lib/task-utils";
import { TaskCommandPopover } from "@/components/tasks/task-command-popover";
import { TaskPriorityIcon } from "@/components/tasks/task-priority-icon";
import { useTaskUpdate } from "@/components/tasks/use-task-update";

type TaskPriorityPickerProps = {
  taskId: Id<"tasks">;
  value: TaskPriority;
  trigger: React.ReactElement;
  className?: string;
};

export function TaskPriorityPicker({
  taskId,
  value,
  trigger,
  className,
}: TaskPriorityPickerProps) {
  const [open, setOpen] = React.useState(false);
  const updateTask = useTaskUpdate(taskId);

  const options = taskPriorityOrder.map((priority) => {
    const config = taskPriorityConfig[priority];
    return {
      value: priority,
      label: config.label,
      shortcut: config.shortcut,
      icon: <TaskPriorityIcon priority={priority} />,
    };
  });

  return (
    <TaskCommandPopover
      open={open}
      onOpenChange={setOpen}
      trigger={trigger}
      placeholder="Change priority to…"
      shortcutKey="P"
      options={options}
      value={value}
      onSelect={(priority) => {
        void updateTask({ priority });
      }}
      className={className}
    />
  );
}
