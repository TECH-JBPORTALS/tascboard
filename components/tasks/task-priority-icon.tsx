"use client";

import { RiSubtractLine } from "@remixicon/react";
import type { TaskPriority } from "@/lib/task-utils";
import { taskPriorityConfig } from "@/lib/task-utils";
import { cn } from "@/lib/utils";

type TaskPriorityIconProps = {
  priority: TaskPriority;
  className?: string;
};

export function TaskPriorityIcon({ priority, className }: TaskPriorityIconProps) {
  const config = taskPriorityConfig[priority];
  const Icon = config.icon;

  if (priority === "medium") {
    return (
      <span className={cn("inline-flex size-3.5 items-center justify-center", className)}>
        <RiSubtractLine className="size-3 text-muted-foreground" />
      </span>
    );
  }

  return (
    <Icon className={cn("size-3.5 shrink-0", config.iconClassName, className)} />
  );
}
