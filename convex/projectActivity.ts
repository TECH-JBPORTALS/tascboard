import { query, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { components } from "./_generated/api";
import { requireIdentity, requireOrganization } from "./lib/auth";

const activityReturn = v.object({
  _id: v.id("projectActivities"),
  _creationTime: v.number(),
  projectId: v.id("projects"),
  organizationId: v.string(),
  actorUserId: v.string(),
  actorName: v.string(),
  kind: v.union(
    v.literal("created"),
    v.literal("name_changed"),
    v.literal("summary_changed"),
    v.literal("status_changed"),
    v.literal("start_date_changed"),
    v.literal("end_date_changed"),
    v.literal("icon_changed"),
    v.literal("color_changed"),
  ),
  fromValue: v.optional(v.string()),
  toValue: v.optional(v.string()),
  createdAt: v.number(),
});

const topPerformerReturn = v.object({
  employeeId: v.string(),
  displayName: v.string(),
  points: v.number(),
});

async function assertProjectAccess(
  ctx: QueryCtx,
  projectId: Id<"projects">,
): Promise<{ orgId: string; project: Doc<"projects"> }> {
  await requireIdentity(ctx);
  const { orgId } = await requireOrganization(ctx);
  const project = await ctx.db.get(projectId);
  if (!project || project.organizationId !== orgId) {
    throw new Error("Not found");
  }
  return { orgId, project };
}

export const list = query({
  args: {
    projectId: v.id("projects"),
    limit: v.optional(v.number()),
  },
  returns: v.array(activityReturn),
  handler: async (ctx, args) => {
    const { project } = await assertProjectAccess(ctx, args.projectId);
    const limit = Math.min(args.limit ?? 50, 100);

    const activities = await ctx.db
      .query("projectActivities")
      .withIndex("by_project", (q) => q.eq("projectId", project._id))
      .order("desc")
      .take(limit);

    return activities;
  },
});

export const topPerformers = query({
  args: {
    projectId: v.id("projects"),
    limit: v.optional(v.number()),
  },
  returns: v.array(topPerformerReturn),
  handler: async (ctx, args) => {
    const { project } = await assertProjectAccess(ctx, args.projectId);
    const limit = Math.min(args.limit ?? 5, 10);

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", project._id))
      .collect();

    if (tasks.length === 0) {
      return [];
    }

    const pointsByEmployee = new Map<string, number>();

    for (const task of tasks) {
      const rows = await ctx.db
        .query("employeePerformancePoints")
        .withIndex("by_task", (q) => q.eq("taskId", task._id))
        .collect();

      for (const row of rows) {
        const key = row.employeeId as string;
        pointsByEmployee.set(key, (pointsByEmployee.get(key) ?? 0) + row.points);
      }
    }

    if (pointsByEmployee.size === 0) {
      const completedByAssignee = new Map<string, number>();
      for (const task of tasks) {
        if (task.status !== "done") {
          continue;
        }
        completedByAssignee.set(
          task.assignedTo,
          (completedByAssignee.get(task.assignedTo) ?? 0) + 1,
        );
      }

      return [...completedByAssignee.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([employeeId, points]) => ({
          employeeId,
          displayName: employeeId,
          points,
        }));
    }

    const ranked = [...pointsByEmployee.entries()].sort((a, b) => b[1] - a[1]);

    const results: Array<{
      employeeId: string;
      displayName: string;
      points: number;
    }> = [];

    for (const [employeeId, points] of ranked.slice(0, limit)) {
      let displayName = employeeId;

      const employee = await ctx.runQuery(components.betterAuth.adapter.findOne, {
        model: "employee",
        where: [{ field: "_id", operator: "eq", value: employeeId }],
      });

      if (employee && typeof employee === "object" && "userId" in employee) {
        const user = await ctx.runQuery(components.betterAuth.adapter.findOne, {
          model: "user",
          where: [
            {
              field: "_id",
              operator: "eq",
              value: (employee as { userId: string }).userId,
            },
          ],
        });

        if (user && typeof user === "object" && "name" in user) {
          const name = (user as { name?: string }).name?.trim();
          if (name) {
            displayName = name;
          }
        }
      }

      results.push({ employeeId, displayName, points });
    }

    return results;
  },
});
