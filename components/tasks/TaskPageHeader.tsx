"use client";

import type * as React from "react";
import Link from "next/link";
import { RiArrowRightSLine } from "@remixicon/react";
import type { Doc } from "@/convex/_generated/dataModel";
import { ProjectIcon } from "@/components/projects/ProjectIcon";
import { PageHeader } from "@/components/ui/page-header";

type TaskPageHeaderProps = {
  orgSlug: string;
  project: Doc<"projects">;
  track: Doc<"tracks">;
  task: Doc<"tasks">;
  className?: string;
};

export function TaskPageHeader({
  orgSlug,
  project,
  track,
  task,
  className,
}: TaskPageHeaderProps) {
  const projectHref = `/${orgSlug}/pro/${project._id}`;
  const trackHref = `${projectHref}/track/${track._id}`;

  return (
    <PageHeader
      className={className}
      title={
        <span className="inline-flex min-w-0 max-w-full items-center gap-2">
          <Link
            href={projectHref}
            className="inline-flex min-w-0 items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ProjectIcon icon={project.icon} color={project.color} size="sm" />
            {project.name}
          </Link>
          <RiArrowRightSLine className="size-4 shrink-0 text-muted-foreground" />
          <Link
            href={trackHref}
            className="min-w-0 truncate text-muted-foreground transition-colors hover:text-foreground"
          >
            {track.name}
          </Link>
          <RiArrowRightSLine className="size-4 shrink-0 text-muted-foreground" />
          <span className="shrink-0 text-foreground">{task.taskCode}</span>
        </span>
      }
    />
  );
}
