import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { removeTrackCascade } from "./track";

export const create = mutation({
  args: {
    organizationID: v.id("organization"),
    name: v.string(),
    description: v.optional(v.string()),
    startDate: v.number(),
    endDate: v.number(),
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("archived"),
      v.literal("on hold")
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    return await ctx.db.insert("projects", {
      organizationID: args.organizationID,
      name: args.name,
      description: args.description,
      startDate: args.startDate,
      endDate: args.endDate,
      status: args.status,
      createdAt: now,
      updatedAt: undefined,
    });
  },
});

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const projects = await ctx.db.query("projects").collect();

    return Promise.all(
      projects.map(async (pro) => ({
        ...pro,
        tracks: await ctx.db
          .query("tracks")
          .withIndex("by_project", (q) => q.eq("projectId", pro._id))
          .collect(),
      })),
    );
  },
});

export const get = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, { projectId }) => {
    return await ctx.db.get(projectId);
  },
});

export const update = mutation({
  args: {
    projectId: v.id("projects"),
    body: v.object({
      name: v.optional(v.string()),
      description: v.optional(v.string()),
      startDate: v.optional(v.number()),
      endDate: v.optional(v.number()),
      status: v.optional(
        v.union(
          v.literal("active"),
          v.literal("completed"),
          v.literal("archived"),
          v.literal("on hold")
        )
      ),
    }),
  },
  handler: async (ctx, { projectId, body }) => {
    const project = await ctx.db.get(projectId);
    if (!project) throw new Error("Project not found");

    const patch: any = { ...body };

    if (body.name !== undefined) {
      const trimmed = body.name.trim();
      if (trimmed.length === 0) {
        throw new Error("Project name cannot be empty");
      }
      patch.name = trimmed;
    }

    if (body.description !== undefined) {
      patch.description = body.description.trim();
    }

    patch.updatedAt = Date.now();

    await ctx.db.patch(projectId, patch);
  },
});

export const remove = mutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, { projectId }) => {
    const project = await ctx.db.get(projectId);

    if (!project) {
      throw new Error("Project not found");
    }

    // Remove all tracks + nested resources
    const tracks = await ctx.db
      .query("tracks")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();

    for (const track of tracks) {
      await removeTrackCascade(ctx, track._id);
    }

    // Remove project labels
    const labels = await ctx.db
      .query("labels")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();

    await Promise.all(
      labels.map((label) => ctx.db.delete(label._id))
    );

    // Remove project itself
    await ctx.db.delete(projectId);

    return {
      success: true,
      message: "Project deleted successfully",
    };
  },
});