import { query } from "./_generated/server";
import { v } from "convex/values";
import { requireOrganization } from "./lib/auth";
import { listEmployeesByOrg } from "./lib/employees";
import { buildGroups } from "./lib/scopeEngine";
import { getUserByUserId } from "./lib/getUser";
export const listAssignableMembers = query({
  args: {
    scope: v.union(v.literal("project"), v.literal("track"), v.literal("task")),

    projectId: v.optional(v.id("projects")),
    trackId: v.optional(v.id("tracks")),
    taskId: v.optional(v.id("tasks")),
  },

  handler: async (ctx, args) => {
    const { orgId } = await requireOrganization(ctx);

    const employees = await listEmployeesByOrg(ctx, orgId);
    const employeeById = new Map(employees.map((e) => [e._id, e]));

    const projectMembers = args.projectId
      ? ((
          await ctx.db
            .query("projectMember")
            .withIndex("by_project", (q) => q.eq("projectId", args.projectId!))
            .collect()
        )
          .map((m) => employeeById.get(m.employeeId)?.userId)
          .filter(Boolean) as string[])
      : [];

    const trackMembers = args.trackId
      ? ((
          await ctx.db
            .query("trackMember")
            .withIndex("by_track", (q) => q.eq("trackId", args.trackId!))
            .collect()
        )
          .map((m) => employeeById.get(m.employeeId)?.userId)
          .filter(Boolean) as string[])
      : [];
    let taskMembers: string[] = [];

    if (args.taskId) {
      const task = await ctx.db.get(args.taskId);

      if (task?.assignedTo) {
        const userId = employeeById.get(task.assignedTo)?.userId;

        if (userId) {
          taskMembers = [userId];
        }
      }
    }
    const organizationAll = employees
      .filter((e) => e.active)
      .map((e) => e.userId);

    const grouped = buildGroups({
      organization: organizationAll,
      project: projectMembers,
      track: trackMembers,
      task: taskMembers,
    });

    const employeeMap = new Map(employees.map((e) => [e.userId, e]));

    const toMember = async (userId: string) => {
      const emp = employeeMap.get(userId);

      // employee missing safety
      if (!emp) {
        return {
          _id: userId,
          employeeId: userId,
          employee: {
            userId,
            name: "Unknown",
            email: "",
            image: null,
            active: false,
          },
        };
      }

      // employeeProfiles → NAME + IMAGE
      const profile = await ctx.db
        .query("employeeProfiles")
        .withIndex("by_employee", (q) => q.eq("employeeId", emp._id))
        .unique();

      // betterAuth user → EMAIL (via helper ONLY)
      const user = await getUserByUserId(ctx, emp.userId);
      if (!profile) {
        throw new Error(`Missing employee profile for ${emp._id}`);
      }

      if (!user?.name) {
        throw new Error(`Missing user for ${emp.userId}`);
      }

      const fullName =
        `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim();

      // 🔴 NEW VALIDATION RULE
      if (user.name.trim() !== fullName) {
        throw new Error(
          `Name mismatch for userId=${userId}: user="${user.name}" profile="${fullName}"`,
        );
      }
      let image = null;

      if (profile?.profilePhotoStorageId) {
        image = await ctx.storage.getUrl(profile.profilePhotoStorageId);
      }

      return {
        _id: emp.userId,
        employeeId: emp.userId,
        employee: {
          userId: emp.userId,
          name: profile
            ? `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim()
            : "Unknown",

          email: user?.email ?? "",
          image,
          active: emp.active,
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
