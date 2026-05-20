"use client";

import { useQuery } from "convex/react";
import {
  RiCalendarLine,
  RiCheckboxCircleFill,
  RiPriceTag3Line,
  RiRecordCircleLine,
} from "@remixicon/react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import {
  formatActivityMessage,
  formatActivityTime,
} from "@/lib/task-activity-message";
type TaskActivityFeedProps = {
  taskId: Id<"tasks">;
};

function ActivityIcon({ kind }: { kind: Doc<"activities">["kind"] }) {
  switch (kind) {
    case "created":
      return <RiCheckboxCircleFill className="size-3.5 text-muted-foreground" />;
    case "status_changed":
      return <RiRecordCircleLine className="size-3.5 text-amber-500" />;
    case "due_date_changed":
      return <RiCalendarLine className="size-3.5 text-muted-foreground" />;
    case "label_added":
    case "label_removed":
      return <RiPriceTag3Line className="size-3.5 text-muted-foreground" />;
    default:
      return <RiRecordCircleLine className="size-3.5 text-muted-foreground" />;
  }
}

export function TaskActivityFeed({ taskId }: TaskActivityFeedProps) {
  const activities = useQuery(api.activity.listByTask, { taskId, limit: 50 });

  return (
    <section className="space-y-3">
      <h3 className="text-xs font-medium text-muted-foreground">Activity</h3>

      {activities === undefined ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : activities.length === 0 ? (
        <p className="text-sm text-muted-foreground">No activity yet.</p>
      ) : (
        <ul className="space-y-3">
          {activities.map((activity) => (
            <li key={activity._id} className="flex gap-2 text-sm">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-muted/60">
                <ActivityIcon kind={activity.kind} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="leading-relaxed text-muted-foreground">
                  {formatActivityMessage(activity)}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground/80">
                  {formatActivityTime(activity)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
