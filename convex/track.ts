import { mutation, MutationCtx, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { removeTaskCascade } from "./task";

const trackStatusValidator = v.union(
  v.literal("active"),
  v.literal("completed"),
  v.literal("archived"),
);

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    projectId: v.id("projects"),
    trackCode: v.string(),
    trackLeaderID: v.id("employee"),
    status: trackStatusValidator,
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("tracks", {
      name: args.name,
      description: args.description,
      projectId: args.projectId,
      trackCode: args.trackCode,
      trackLeaderID: args.trackLeaderID,
      status: args.status,
      createdAt: Date.now(),
    });
  },
});

export const get = query({
  args: {
    trackId: v.id("tracks"),
  },
  handler: async (ctx, { trackId }) => {
    const track = await ctx.db.get(trackId);
    if (!track) return null;
    const project = await ctx.db.get(track.projectId);
    return { ...track, project };
  },
});

export const update = mutation({
  args: {
    trackId: v.id("tracks"),
    body: v.object({
      name: v.optional(v.string()),
      description: v.optional(v.string()),
      trackCode: v.optional(v.string()),
      trackLeaderID: v.optional(v.id("employee")),
      status: v.optional(trackStatusValidator),
    }),
  },
  handler: async (ctx, { trackId, body }) => {
    const track = await ctx.db.get(trackId);
    if (!track) throw new Error("Track not found");

    if (body.name !== undefined) {
      const trimmed = body.name.trim();
      if (trimmed.length === 0) {
        throw new Error("Track name cannot be empty");
      }
      body = { ...body, name: trimmed };
    }
    if (body.description !== undefined) {
      body = { ...body, description: body.description.trim() };
    }

    await ctx.db.patch(trackId, { ...body, updatedAt: Date.now() });
  },
});

// Cascade-deletes a track along with every task it owns.
export async function removeTrackCascade(
  ctx: MutationCtx,
  trackId: Id<"tracks">,
) {
  const tasks = await ctx.db
    .query("tasks")
    .withIndex("by_track", (q) => q.eq("trackId", trackId))
    .collect();
  for (const task of tasks) {
    await removeTaskCascade(ctx, task._id);
  }
  await ctx.db.delete(trackId);
}

export const remove = mutation({
  args: {
    trackId: v.id("tracks"),
  },
  handler: async (ctx, { trackId }) => {
    await removeTrackCascade(ctx, trackId);
  },
});
