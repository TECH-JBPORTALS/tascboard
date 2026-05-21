"use client";

import * as React from "react";
import type { Id } from "@/convex/_generated/dataModel";
import {
  taskStatusConfig,
  taskStatusOrder,
  type TaskStatus,
} from "@/lib/task-utils";
import { TaskCommandPopover } from "@/components/tasks/TaskCommandPopover";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";

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

type TaskStatusIconProps = {
  status: TaskStatus;
  className?: string;
};

export function TaskStatusIcon({ status, className }: TaskStatusIconProps) {
  const config = taskStatusConfig[status];
  const Icon = config.icon;

  return (
    <Icon className={cn("size-4 shrink-0", config.iconClassName, className)} />
  );
}
