"use client";

import type { TaskStatus } from "@/lib/task-utils";
import { taskStatusConfig } from "@/lib/task-utils";
import { cn } from "@/lib/utils";

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
