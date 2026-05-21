"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";

type TaskUpdateBody = {
  title?: string;
  description?: string;
  status?: Doc<"tasks">["status"];
  priority?: Doc<"tasks">["priority"];
  complexity?: Doc<"tasks">["complexity"];
  startDate?: number;
  endDate?: number;
  sprintId?: Id<"sprints"> | null;
};

export function useTaskUpdate(taskId: Id<"tasks">) {
  const updateTask = useMutation(api.task.update);

  return async (body: TaskUpdateBody) => {
    await updateTask({ taskId, body });
  };
}
