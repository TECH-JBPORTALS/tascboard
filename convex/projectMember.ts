import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { requireIdentity } from "./lib/auth";
import { getUserByUserId } from "./lib/getUser";
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

export const toggleMember = mutation({
  args: {
    employeeId: v.string(),
    projectId: v.id("projects"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { userId } = await requireIdentity(ctx);

    const existing = await ctx.db
      .query("projectMember")
      .withIndex("by_project_employee", (q) =>
        q.eq("projectId", args.projectId).eq("employeeId", args.employeeId),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      return null;
    }

    await ctx.db.insert("projectMember", {
      projectId: args.projectId,
      employeeId: args.employeeId,
      manager: false,
      assignedBy: userId,
      createAt: Date.now(),
    });

    return null;
  },
});

export const setManager = mutation({
  args: {
    employeeId: v.string(),
    projectId: v.id("projects"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireIdentity(ctx);

    const existingMember = await ctx.db
      .query("projectMember")
      .withIndex("by_project_employee", (q) =>
        q.eq("projectId", args.projectId).eq("employeeId", args.employeeId),
      )
      .unique();

    const existingManager = await ctx.db
      .query("projectMember")
      .withIndex("by_project_manager", (q) =>
        q.eq("projectId", args.projectId).eq("manager", true),
      )
      .unique();

    if (existingManager && existingManager.employeeId !== args.employeeId) {
      throw new Error("Project already has a manager");
    }

    if (existingMember) {
      await ctx.db.patch(existingMember._id, {
        manager: true,
        updatedAt: Date.now(),
      });
      return null;
    }
    const { userId } = await requireIdentity(ctx);
    await ctx.db.insert("projectMember", {
      projectId: args.projectId,
      employeeId: args.employeeId,
      manager: true,
      assignedBy: userId,
      createAt: Date.now(),
    });

    return null;
  },
});

/**
 * REMOVE MANAGER ROLE ONLY
 * (still remains a member)
 */
export const removeManager = mutation({
  args: {
    employeeId: v.string(),
    projectId: v.id("projects"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireIdentity(ctx);

    const member = await ctx.db
      .query("projectMember")
      .withIndex("by_project_employee", (q) =>
        q.eq("projectId", args.projectId).eq("employeeId", args.employeeId),
      )
      .unique();

    if (!member) {
      throw new Error("Member not found");
    }

    await ctx.db.patch(member._id, {
      manager: false,
      updatedAt: Date.now(),
    });

    return null;
  },
});
export const list = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    await requireIdentity(ctx);

    const members = await ctx.db
      .query("projectMember")
      .withIndex("by_project", (q) =>
        q.eq("projectId", args.projectId),
      )
      .collect();

    const results = await Promise.all(
      members.map(async (member) => {
        const profile = await ctx.db
          .query("employeeProfiles")
          .withIndex("by_employee", (q) =>
            q.eq("employeeId", member.employeeId),
          )
          .unique();

        const user = await getUserByUserId(ctx, member.employeeId);

        const image = profile?.profilePhotoStorageId
          ? await ctx.storage.getUrl(profile.profilePhotoStorageId)
          : "";

        return {
          _id: member._id,
          employeeId: member.employeeId,
          employee: {
            _id: profile?.employeeId ?? member.employeeId,
            name: profile
              ? `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim()
              : "Unknown",
            image: image ?? "",
            email: user?.email ?? "",
          },
        };
      }),
    );

    return results;
  },
});