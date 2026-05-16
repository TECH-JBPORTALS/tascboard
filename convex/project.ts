import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { removeTrackCascade } from "./track";

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("projects", {
      name: args.name,
      description: args.description,
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
    }),
  },
  handler: async (ctx, { projectId, body }) => {
    const project = await ctx.db.get(projectId);
    if (!project) throw new Error("Project not found");

    if (body.name !== undefined) {
      const trimmed = body.name.trim();
      if (trimmed.length === 0) {
        throw new Error("Project name cannot be empty");
      }
      body = { ...body, name: trimmed };
    }
    if (body.description !== undefined) {
      body = { ...body, description: body.description.trim() };
    }

    await ctx.db.patch(projectId, body);
  },
});

export const remove = mutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, { projectId }) => {
    const project = await ctx.db.get(projectId);
    if (!project) return;

    const tracks = await ctx.db
      .query("tracks")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();
    for (const track of tracks) {
      await removeTrackCascade(ctx, track._id);
    }

    // Drop project-scoped labels; their task links were cleared in the task
    // cascade above.
    const labels = await ctx.db
      .query("labels")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();
    await Promise.all(labels.map((l) => ctx.db.delete(l._id)));

    await ctx.db.delete(projectId);
  },
});
