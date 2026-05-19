"use client";

import { RiSideBarLine } from "@remixicon/react";
import type { Id } from "@/convex/_generated/dataModel";
import { ProjectActivityLog } from "@/components/projects/project-activity-log";
import { ProjectTopPerformers } from "@/components/projects/project-top-performers";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ProjectDetailPanelProps = {
  projectId: Id<"projects">;
  open: boolean;
  onToggle: () => void;
  className?: string;
};

export function ProjectDetailPanelToggle({
  open,
  onToggle,
  className,
}: Pick<ProjectDetailPanelProps, "open" | "onToggle" | "className">) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className={cn("text-muted-foreground", className)}
      onClick={onToggle}
      aria-expanded={open}
      aria-label={open ? "Hide project panel" : "Show project panel"}
    >
      <RiSideBarLine className={cn("size-4", open && "text-foreground")} />
    </Button>
  );
}

export function ProjectDetailPanel({
  projectId,
  open,
  className,
}: Pick<ProjectDetailPanelProps, "projectId" | "open" | "className">) {
  if (!open) {
    return null;
  }

  return (
    <aside
      className={cn(
        "flex w-96 shrink-0 flex-col border-l bg-background",
        className,
      )}
    >
      <ProjectTopPerformers projectId={projectId} />
      <ProjectActivityLog projectId={projectId} className="min-h-0 flex-1" />
    </aside>
  );
}
