import { query } from "./_generated/server";
import { v } from "convex/values";

export const listByTask = query({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, { taskId }) => {
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_task", (q) => q.eq("taskId", taskId))
      .collect();
    return activities.sort((a, b) => b._creationTime - a._creationTime);
  },
});
