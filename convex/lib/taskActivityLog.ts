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

export async function logTaskActivity(
  ctx: MutationCtx,
  args: LogTaskActivityArgs,
) {
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
