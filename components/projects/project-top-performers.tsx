"use client";

import { useQuery } from "convex/react";
import { RiTrophyLine } from "@remixicon/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

type ProjectTopPerformersProps = {
  projectId: Id<"projects">;
  className?: string;
};

export function ProjectTopPerformers({
  projectId,
  className,
}: ProjectTopPerformersProps) {
  const performers = useQuery(api.projectActivity.topPerformers, {
    projectId,
    limit: 5,
  });

  if (performers === undefined || performers.length === 0) {
    return null;
  }

  return (
    <section className={cn("shrink-0 border-b", className)}>
      <h3 className="flex items-center gap-1.5 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <RiTrophyLine className="size-3.5" />
        Top performers
      </h3>
      <ol className="space-y-2 px-4 pb-4">
        {performers.map((performer, index) => (
          <li
            key={performer.employeeId}
            className="flex items-center justify-between gap-2 text-sm"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                {index + 1}
              </span>
              <span className="truncate font-medium">{performer.displayName}</span>
            </span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              {performer.points} pts
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
