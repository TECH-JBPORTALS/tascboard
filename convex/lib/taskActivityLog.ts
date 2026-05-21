import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { actorDisplayName } from "./projectActivityLog";

export const taskActivityKindValidator = [
  "created",
  "title_changed",
  "status_changed",
  "priority_changed",
  "due_date_changed",
  "label_added",
  "label_removed",
] as const;

export type TaskActivityKind = (typeof taskActivityKindValidator)[number];

type LogTaskActivityArgs = {
  taskId: Id<"tasks">;
  actorUserId: string;
  actorName: string;
  kind: TaskActivityKind;
  fromValue?: string;
  toValue?: string;
  meta?: string;
};

function getStartOfToday() {
  const now = new Date();

  now.setHours(0, 0, 0, 0);

  return now.getTime();
}

export async function logTaskActivity(
  ctx: MutationCtx,
  args: LogTaskActivityArgs,
) {
  const startOfToday = getStartOfToday();

  const existingActivities = await ctx.db
    .query("activities")
    .withIndex("by_task", (q) =>
      q.eq("taskId", args.taskId),
    )
    .collect();

    const duplicateActivity = existingActivities.find(
      (activity) =>
        activity.actorUserId === args.actorUserId &&
        activity.kind === args.kind &&
        activity.fromValue === args.fromValue &&
        activity.toValue === args.toValue &&
        (activity.createdAt ?? 0) >= startOfToday,
    );

  if (duplicateActivity) {
    return;
  }

  await ctx.db.insert("activities", {
    taskId: args.taskId,
    deviceName: args.actorName,
    kind: args.kind,
    fromValue: args.fromValue,
    toValue: args.toValue,
    meta: args.meta,
    actorUserId: args.actorUserId,
    createdAt: Date.now(),
  });
}

export { actorDisplayName };



export function formatTaskDate(timestamp: number) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(timestamp));
}
