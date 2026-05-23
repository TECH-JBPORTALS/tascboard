"use client";

import { useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

type Activity = Doc<"projectActivities">;

const kindLabels: Record<Activity["kind"], string> = {
  created: "created the project",
  name_changed: "renamed the project",
  summary_changed: "updated the summary",
  status_changed: "changed status",
  start_date_changed: "changed start date",
  end_date_changed: "changed end date",
  icon_changed: "changed the icon",
  color_changed: "changed the color",
};

function formatActivityDetail(activity: Activity) {
  switch (activity.kind) {
    case "created":
      return activity.toValue ? `"${activity.toValue}"` : null;
    case "name_changed":
    case "summary_changed":
      if (activity.fromValue && activity.toValue) {
        return `"${activity.fromValue}" → "${activity.toValue}"`;
      }
      if (activity.toValue) {
        return `"${activity.toValue}"`;
      }
      return activity.fromValue ? `cleared "${activity.fromValue}"` : null;
    case "status_changed":
      if (activity.fromValue && activity.toValue) {
        return `${activity.fromValue} → ${activity.toValue}`;
      }
      return activity.toValue ?? null;
    case "start_date_changed":
    case "end_date_changed":
      if (activity.fromValue && activity.toValue) {
        return `${activity.fromValue} → ${activity.toValue}`;
      }
      return activity.toValue ?? null;
    case "icon_changed":
      if (activity.fromValue && activity.toValue) {
        return `${activity.fromValue} → ${activity.toValue}`;
      }
      return activity.toValue ?? null;
    case "color_changed":
      if (activity.fromValue && activity.toValue) {
        return `${activity.fromValue} → ${activity.toValue}`;
      }
      return activity.toValue ?? null;
    default:
      return null;
  }
}

type ProjectActivityLogProps = {
  projectId: Id<"projects">;
  className?: string;
  hideTitle?: boolean;
  scrollable?: boolean;
};

export function ProjectActivityLog({
  projectId,
  className,
  hideTitle = false,
  scrollable = true,
}: ProjectActivityLogProps) {
  const activities = useQuery(api.projectActivity.list, { projectId, limit: 50 });

  return (
    <div
      className={cn(
        "flex flex-col",
        scrollable && "min-h-0 flex-1",
        className,
      )}
    >
      {!hideTitle ? (
        <h3 className="shrink-0 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Activity
        </h3>
      ) : null}
      <div className={cn("px-2", scrollable && "min-h-0 flex-1 overflow-y-auto")}>
        {activities === undefined ? (
          <p className="px-2 py-4 text-sm text-muted-foreground">Loading…</p>
        ) : activities.length === 0 ? (
          <p className="px-2 py-4 text-sm text-muted-foreground">
            No activity yet.
          </p>
        ) : (
          <ul className="space-y-3 px-2 pb-4">
            {activities.map((activity) => {
              const detail = formatActivityDetail(activity);
              return (
                <li key={activity._id} className="text-sm">
                  <p className="leading-snug">
                    <span className="font-medium">{activity.actorName}</span>{" "}
                    <span className="text-muted-foreground">
                      {kindLabels[activity.kind]}
                    </span>
                  </p>
                  {detail ? (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {detail}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs text-muted-foreground/80">
                    {formatDistanceToNow(activity.createdAt, { addSuffix: true })}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
