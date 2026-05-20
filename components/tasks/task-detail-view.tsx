"use client";

import * as React from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { TaskActivityFeed } from "@/components/tasks/task-activity-feed";
import { TaskCommentsSection } from "@/components/tasks/task-comments-section";
import { TaskDetailSidebar } from "@/components/tasks/task-detail-sidebar";
import { TaskPlateEditor } from "@/components/tasks/task-plate-editor";
import { TaskPageHeader } from "@/components/tasks/task-page-header";
import { TaskSubtasksSection } from "@/components/tasks/task-subtasks-section";
import { cn } from "@/lib/utils";
import { PlateEditor } from "../editor/plate-editor";

type TaskDetail = Doc<"tasks"> & {
  track: Doc<"tracks"> | null;
  project: Doc<"projects"> | null;
  labels: Doc<"labels">[];
};

type TaskDetailViewProps = {
  orgSlug: string;
  task: TaskDetail;
};

export function TaskDetailView({ orgSlug, task }: TaskDetailViewProps) {
  const updateDescription = useMutation(api.task.updateDescription);
  const updateTask = useMutation(api.task.update);
  const [title, setTitle] = React.useState(task.title);
  const [savingTitle, setSavingTitle] = React.useState(false);

  async function saveTitle() {
    const trimmed = title.trim();
    if (!trimmed || trimmed === task.title) return;
    setSavingTitle(true);
    try {
      await updateTask({
        taskId: task._id,
        body: { title: trimmed },
      });
    } finally {
      setSavingTitle(false);
    }
  }

  const track = task.track;
  const project = task.project;

  if (!track || !project) {
    return (
      <p className="p-8 text-muted-foreground">Task context is unavailable.</p>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">
        <TaskPageHeader
          orgSlug={orgSlug}
          project={project}
          track={track}
          task={task}
          className="top-0 z-20"
        />
        <div className="min-h-0 flex-1">
          <div className="mx-auto max-w-3xl px-4 py-6 md:px-8">
            <textarea
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => void saveTitle()}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void saveTitle();
                  (e.target as HTMLInputElement).blur();
                }
              }}
              name="task-title"
              className={cn(
                "mb-4 w-full bg-transparent text-2xl font-semibold resize-none min-h-10 h-fit! text-foreground outline-none",
                savingTitle && "opacity-70",
              )}
              aria-label="Task title"
            />

            <div className="mb-4">
              <p className="text-xs font-mono font-semibold text-muted-foreground">
                Description
              </p>
              <PlateEditor value={task.description} />
            </div>

            <div className="mb-4">
              <TaskSubtasksSection taskId={task._id} />
            </div>

            <div className="mb-4">
              <TaskActivityFeed taskId={task._id} />
            </div>

            {/* <TaskCommentsSection taskId={task._id} /> */}
          </div>
        </div>
      </div>

      <TaskDetailSidebar
        orgSlug={orgSlug}
        task={task}
        project={project}
        labels={task.labels}
      />
    </div>
  );
}
