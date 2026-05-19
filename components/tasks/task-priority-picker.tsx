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
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

type TaskPriorityPickerBaseProps = {
  value: TaskPriority;
  trigger: React.ReactElement;
  className?: string;
  placeholder?: string;
};

type TaskPriorityPickerProps = TaskPriorityPickerBaseProps &
  (
    | { taskId: Id<"tasks">; onSelect?: (priority: TaskPriority) => void }
    | { taskId?: undefined; onSelect: (priority: TaskPriority) => void }
  );

export function TaskPriorityPicker({
  value,
  trigger,
  className,
  placeholder = "Change priority to…",
  ...mode
}: TaskPriorityPickerProps) {
  const [open, setOpen] = React.useState(false);
  const updateTaskMutation = useMutation(api.task.update);

  const options = taskPriorityOrder.map((priority) => {
    const config = taskPriorityConfig[priority];
    return {
      value: priority,
      label: config.label,
      shortcut: config.shortcut,
      icon: <TaskPriorityIcon priority={priority} />,
    };
  });

  const handleSelect = (priority: TaskPriority) => {
    if (mode.onSelect) {
      mode.onSelect(priority);
      return;
    }
    if (mode.taskId) {
      void updateTaskMutation({ taskId: mode.taskId, body: { priority } });
    }
  };

  return (
    <TaskCommandPopover
      open={open}
      onOpenChange={setOpen}
      trigger={trigger}
      placeholder={placeholder}
      shortcutKey="P"
      options={options}
      value={value}
      onSelect={handleSelect}
      className={className}
    />
  );
}
