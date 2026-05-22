import { query } from "./_generated/server";
import { v } from "convex/values";
import { requireOrganization } from "./lib/auth";
import { listEmployeesByOrg } from "./lib/employees";
import { buildGroups } from "./lib/scopeEngine";
import { getUserByUserId } from "./lib/getUser";
export const listAssignableMembers = query({
  args: {
    scope: v.union(
      v.literal("project"),
      v.literal("track"),
      v.literal("task"),
    ),

    projectId: v.optional(v.id("projects")),
    trackId: v.optional(v.id("tracks")),
    taskId: v.optional(v.id("tasks")),
  },

  handler: async (ctx, args) => {
    const { orgId } = await requireOrganization(ctx);

    const employees = await listEmployeesByOrg(ctx, orgId);
    const projectMembers = args.projectId
    ? (
        await ctx.db
          .query("projectMember")
          .withIndex("by_project", (q) =>
            q.eq("projectId", args.projectId!),
          )
          .collect()
      ).map((m) => m.employeeId)
    : [];
  
  const trackMembers = args.trackId
    ? (
        await ctx.db
          .query("trackMember")
          .withIndex("by_track", (q) =>
            q.eq("trackId", args.trackId!),
          )
          .collect()
      ).map((m) => m.employeeId)
    : [];
  
  let taskMembers: string[] = [];
  
  if (args.taskId) {
    const task = await ctx.db.get(args.taskId);
  
    if (task?.assignedTo) {
      taskMembers = [task.assignedTo];
    }
  }
  
  // ✅ NOW define this AFTER everything
  const organizationAll = employees
  .filter((e) => e.active)
  .map((e) => e.userId);
    
    const grouped = buildGroups({
      organization: organizationAll,
      project: projectMembers,
      track: trackMembers,
      task: taskMembers,
    });

    const employeeMap = new Map(
      employees.map((e) => [e.userId, e]),
    );

    const toMember = async (id: string) => {
        const emp = employeeMap.get(id);
      
        const user = emp ? await getUserByUserId(ctx, emp.userId) : null;
      
        return {
          _id: id,
          employeeId: id,
          employee: {
            userId: emp?.userId ?? id,
            name: user?.name ?? "Unknown",
            email: user?.email ?? "",
            image: user?.image ?? null,
            active: emp?.active ?? false,
          },
        };
      };
      const result = {
        organization: await Promise.all(grouped.organization.map(toMember)),
        project: await Promise.all(grouped.project.map(toMember)),
        track: await Promise.all(grouped.track.map(toMember)),
        task: await Promise.all(grouped.task.map(toMember)),
      };
    if (args.scope === "project") {
      return [
        { group: "project", members: result.project },
        { group: "organization", members: result.organization },
      ];
    }

    if (args.scope === "track") {
      return [
        { group: "track", members: result.track },
        { group: "project", members: result.project },
        { group: "organization", members: result.organization },
      ];
    }

    return [
      { group: "task", members: result.task },
      { group: "track", members: result.track },
      { group: "project", members: result.project },
      { group: "organization", members: result.organization },
    ];
  },
});