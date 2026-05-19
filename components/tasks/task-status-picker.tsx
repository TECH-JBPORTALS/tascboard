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
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

type TaskStatusPickerBaseProps = {
  value: TaskStatus;
  trigger: React.ReactElement;
  className?: string;
  placeholder?: string;
};

type TaskStatusPickerProps = TaskStatusPickerBaseProps &
  (
    | { taskId: Id<"tasks">; onSelect?: (status: TaskStatus) => void }
    | { taskId?: undefined; onSelect: (status: TaskStatus) => void }
  );

export function TaskStatusPicker({
  value,
  trigger,
  className,
  placeholder = "Change status…",
  ...mode
}: TaskStatusPickerProps) {
  const [open, setOpen] = React.useState(false);
  const updateTaskMutation = useMutation(api.task.update);

  const options = taskStatusOrder.map((status) => {
    const config = taskStatusConfig[status];
    return {
      value: status,
      label: config.label,
      shortcut: config.shortcut,
      icon: <TaskStatusIcon status={status} className="size-3.5" />,
    };
  });

  const handleSelect = (status: TaskStatus) => {
    if (mode.onSelect) {
      mode.onSelect(status);
      return;
    }
    if (mode.taskId) {
      void updateTaskMutation({ taskId: mode.taskId, body: { status } });
    }
  };

  return (
    <TaskCommandPopover
      open={open}
      onOpenChange={setOpen}
      trigger={trigger}
      placeholder={placeholder}
      shortcutKey="S"
      options={options}
      value={value}
      onSelect={handleSelect}
      className={className}
    />
  );
}
