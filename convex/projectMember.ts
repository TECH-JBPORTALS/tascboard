import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireIdentity } from "./lib/auth";
import type { Doc } from "./_generated/dataModel";
const projectMemberReturn = v.object({
  _id: v.id("projectMember"),
  _creationTime: v.number(),
  projectId: v.id("projects"),
  employeeId: v.string(),
  manager: v.boolean(),
  assignedBy: v.string(),
  createAt: v.number(),
  updatedAt: v.optional(v.number()),
});

export const add = mutation({
  args: {
    projectId: v.id("projects"),
    employeeId: v.string(),
    manager: v.optional(v.boolean()),
  },
  returns: v.id("projectMember"),
  handler: async (ctx, args) => {
    const { userId } = await requireIdentity(ctx);

    const existingMember = await ctx.db
      .query("projectMember")
      .withIndex("by_project_employee", (q) =>
        q
          .eq("projectId", args.projectId)
          .eq("employeeId", args.employeeId),
      )
      .unique();

    if (existingMember) {
      throw new Error("Employee is already a member of this project");
    }

    if (args.manager === true) {
      const existingManager = await ctx.db
        .query("projectMember")
        .withIndex("by_project_manager", (q) =>
          q
            .eq("projectId", args.projectId)
            .eq("manager", true),
        )
        .unique();

      if (existingManager) {
        throw new Error("Project already has a manager");
      }
    }

    const insertedId = await ctx.db.insert("projectMember", {
      projectId: args.projectId,
      employeeId: args.employeeId,
      manager: args.manager ?? false,
      assignedBy: userId,
      createAt: Date.now(),
    });

    return insertedId;
  },
});

export const update = mutation({
    args: {
      memberId: v.id("projectMember"),
      manager: v.optional(v.boolean()),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
      await requireIdentity(ctx);
  
      const member = await ctx.db.get(args.memberId);
  
      if (!member) {
        throw new Error("Project member not found");
      }
  
      // If promoting to manager, ensure only one manager exists
      if (args.manager === true && member.manager !== true) {
        const existingManager = await ctx.db
          .query("projectMember")
          .withIndex("by_project_manager", (q) =>
            q.eq("projectId", member.projectId).eq("manager", true),
          )
          .unique();
  
        if (existingManager) {
          throw new Error("Project already has a manager");
        }
      }
  
      await ctx.db.patch(args.memberId, {
        manager: args.manager ?? member.manager,
        updatedAt: Date.now(),
      });
  
      return null;
    },
  });

export const remove = mutation({
  args: {
    memberId: v.id("projectMember"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireIdentity(ctx);

    const member = await ctx.db.get(args.memberId);

    if (!member) {
      throw new Error("Project member not found");
    }

    await ctx.db.delete(args.memberId);

    return null;
  },
});
export const list = query({
    args: {},
    handler: async (ctx) => {
      const { userId } = await requireIdentity(ctx);
      const memberships = await ctx.db
        .query("projectMember")
        .withIndex("by_employee", (q) =>
          q.eq("employeeId", userId),
        )
        .collect();
  
      if (memberships.length === 0) {
        return [];
      }
  
      const projects = await Promise.all(
        memberships.map(async (member) => {
          return await ctx.db.get(member.projectId);
        }),
      );
  
      return projects.filter(
        (project): project is NonNullable<typeof project> =>
          project !== null,
      );
    },
  });

  export const get = query({
    args: { projectId: v.id("projects") },
    handler: async (ctx, args) => {
      const { userId } = await requireIdentity(ctx);
  
      const member = await ctx.db
        .query("projectMember")
        .withIndex("by_project_employee", (q) =>
          q
            .eq("projectId", args.projectId)
            .eq("employeeId", userId),
        )
        .unique();
  
      if (!member) {
        throw new Error("Not authorized to view this project");
      }
  
      return await ctx.db.get(args.projectId);
    },
  });