"use client";

import * as React from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { TaskActivityFeed } from "@/components/tasks/TaskActivityFeed";
import { TaskDetailSidebar } from "@/components/tasks/TaskDetailSidebar";
import { TaskPageHeader } from "@/components/tasks/TaskPageHeader";
import { TaskSubtasksSection } from "@/components/tasks/TaskSubtasksSection";
import { PlateEditor } from "../editor/plate-editor";
import { TitleInput } from "../TitleInput";

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
  const [description, setDescription] = React.useState(
    typeof task.description === "string" ? task.description : "",
  );
  const savedDescriptionRef = React.useRef(description);

  async function saveTitle() {
    const trimmed = title.trim();
    if (!trimmed || trimmed === task.title) return;
    await updateTask({
      taskId: task._id,
      body: { title: trimmed },
    });
  }

  async function saveDescription(nextMarkdown: string) {
    if (nextMarkdown === savedDescriptionRef.current) return;
    savedDescriptionRef.current = nextMarkdown;
    await updateDescription({ taskId: task._id, description: nextMarkdown });
  }

  const track = task.track;
  const project = task.project;

  if (!track || !project) {
    return (
      <p className="p-8 text-muted-foreground">Task context is unavailable.</p>
    );
  }

  return (
    <>
      <TaskPageHeader
        orgSlug={orgSlug}
        project={project}
        track={track}
        task={task}
        className="top-0 z-20"
      />
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row lg:items-start lg:gap-4 lg:pr-4">
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">
          <div className="min-h-0 flex-1">
            <div className="mx-auto max-w-3xl px-4 py-6 md:px-8">
              <TitleInput
                value={title}
                placeholder="Task title"
                onChange={(value) => setTitle(value)}
                onSave={saveTitle}
              />

              <div className="mb-4">
                <p className="text-xs font-mono font-semibold text-muted-foreground">
                  Description
                </p>
                <PlateEditor
                  value={description}
                  onChange={setDescription}
                  onSave={(markdown) => void saveDescription(markdown)}
                />
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
    </>
  );
}
