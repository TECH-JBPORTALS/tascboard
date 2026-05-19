"use client";

import { useMutation } from "convex/react";
import * as React from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

type ProjectTitleProps = {
  projectId: Id<"projects">;
  name: string;
};

export function ProjectTitle({ projectId, name }: ProjectTitleProps) {
  const updateProject = useMutation(api.project.update);
  const [value, setValue] = React.useState(name);
  const [isSaving, setIsSaving] = React.useState(false);

  async function saveTitle() {
    const trimmed = value.trim();

    if (trimmed.length === 0 || trimmed === name) {
      setValue(name);
      return;
    }

    setIsSaving(true);

    try {
      await updateProject({
        projectId,
        body: { name: trimmed },
      });
    } catch {
      setValue(name);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <input
      value={value}
      onChange={(event) => setValue(event.target.value)}
      onBlur={() => void saveTitle()}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.currentTarget.blur();
        }
      }}
      disabled={isSaving}
      className={cn(
        "w-full border-none bg-transparent font-heading text-3xl font-semibold tracking-tight outline-none",
        "placeholder:text-muted-foreground focus-visible:ring-0",
      )}
      placeholder="Project name"
      aria-label="Project name"
    />
  );
}
