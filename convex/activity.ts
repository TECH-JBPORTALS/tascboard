import { query } from "./_generated/server";
import { v } from "convex/values";
import { requireIdentity } from "./lib/auth";

const activityReturn = v.object({
  _id: v.id("activities"),
  _creationTime: v.number(),
  taskId: v.id("tasks"),
  deviceName: v.string(),
  actorUserId: v.optional(v.string()),
  kind: v.union(
    v.literal("created"),
    v.literal("title_changed"),
    v.literal("status_changed"),
    v.literal("priority_changed"),
    v.literal("due_date_changed"),
    v.literal("label_added"),
    v.literal("label_removed"),
  ),
  fromValue: v.optional(v.string()),
  toValue: v.optional(v.string()),
  meta: v.optional(v.string()),
  createdAt: v.optional(v.number()),
});

export const listByTask = query({
  args: {
    taskId: v.id("tasks"),
    limit: v.optional(v.number()),
  },
  returns: v.array(activityReturn),
  handler: async (ctx, { taskId, limit }) => {
    await requireIdentity(ctx);

    const take = Math.min(limit ?? 50, 100);
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_task", (q) => q.eq("taskId", taskId))
      .order("desc")
      .take(take);

    return activities;
  },
});
