import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

export const projectActivityKindValidator = [
  "created",
  "name_changed",
  "summary_changed",
  "status_changed",
  "start_date_changed",
  "end_date_changed",
  "icon_changed",
  "color_changed",
] as const;

export type ProjectActivityKind = (typeof projectActivityKindValidator)[number];

type LogProjectActivityArgs = {
  projectId: Id<"projects">;
  organizationId: string;
  actorUserId: string;
  actorName: string;
  kind: ProjectActivityKind;
  fromValue?: string;
  toValue?: string;
};
function getStartOfToday() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.getTime();
}
export async function logProjectActivity(
  ctx: MutationCtx,
  args: LogProjectActivityArgs,
) {
  const startOfToday = getStartOfToday();

  const existingActivities = await ctx.db
    .query("projectActivities")
    .withIndex("by_project_actor", (q) =>
      q.eq("projectId", args.projectId).eq("actorUserId", args.actorUserId),
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
  await ctx.db.insert("projectActivities", {
    projectId: args.projectId,
    organizationId: args.organizationId,
    actorUserId: args.actorUserId,
    actorName: args.actorName,
    kind: args.kind,
    fromValue: args.fromValue,
    toValue: args.toValue,
    createdAt: Date.now(),
  });
}

export function formatProjectDate(timestamp: number) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(timestamp));
}

export function actorDisplayName(identity: {
  name?: string | null;
  email?: string | null;
}) {
  const name = identity.name?.trim();
  if (name) {
    return name;
  }
  const email = identity.email?.trim();
  if (email) {
    return email;
  }
  return "Someone";
}
