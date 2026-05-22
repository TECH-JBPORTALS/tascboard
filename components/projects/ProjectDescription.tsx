"use client";

import React from "react";
import { PlateEditor } from "../editor/plate-editor";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import debounce from "lodash/debounce";

export function ProjectDescription({
  projectId,
  initialDescription,
}: {
  projectId: Id<"projects">;
  initialDescription: string;
}) {
  const updateDescription = useMutation(api.project.updateDescription);

  const debouncedUpdateDescription = debounce((value: string) => {
    if (initialDescription !== value && value !== "")
      updateDescription({ projectId, description: value });
  }, 500);

  function handleChange(value: string) {
    debouncedUpdateDescription(value);
  }

  return (
    <div>
      <p className="text-sm text-muted-foreground font-semibold">Description</p>
      <PlateEditor value={initialDescription} onChange={handleChange} />
    </div>
  );
}
