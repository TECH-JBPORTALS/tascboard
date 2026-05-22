"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { TitleInput } from "../TitleInput";

type ProjectSummaryProps = {
  projectId: Id<"projects">;
  summary: string;
};

export function ProjectSummary({ projectId, summary }: ProjectSummaryProps) {
  const updateProject = useMutation(api.project.update);

  async function saveSummary(value: string) {
    const trimmed = value.trim();

    await updateProject({
      projectId,
      body: { summary: trimmed.length > 0 ? trimmed : undefined },
    });
  }

  return (
    <TitleInput
      value={summary}
      onSave={(value) => saveSummary(value)}
      className={"text-sm! font-normal! pb-0!"}
      placeholder="Add a short summary…"
      aria-label="Project summary"
    />
  );
}
