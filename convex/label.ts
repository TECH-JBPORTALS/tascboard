import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { logActivity } from "./task";

export const listByProject = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, { projectId }) => {
    return await ctx.db
      .query("labels")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();
  },
});

export const create = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.string(),
    color: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("labels", args);
  },
});

export const remove = mutation({
  args: {
    labelId: v.id("labels"),
  },
  handler: async (ctx, { labelId }) => {
    const links = await ctx.db
      .query("taskLabels")
      .withIndex("by_label", (q) => q.eq("labelId", labelId))
      .collect();
    await Promise.all(links.map((l) => ctx.db.delete(l._id)));
    return await ctx.db.delete(labelId);
  },
});

export const attachToTask = mutation({
  args: {
    taskId: v.id("tasks"),
    labelId: v.id("labels"),
    deviceName: v.string(),
  },
  handler: async (ctx, { taskId, labelId, deviceName }) => {
    const existing = await ctx.db
      .query("taskLabels")
      .withIndex("by_task", (q) => q.eq("taskId", taskId))
      .collect();
    if (existing.some((link) => link.labelId === labelId)) return null;

    const label = await ctx.db.get(labelId);
    if (!label) throw new Error("Label not found");

    const id = await ctx.db.insert("taskLabels", { taskId, labelId });
    await logActivity(ctx, {
      taskId,
      deviceName,
      kind: "label_added",
      meta: label.name,
    });
    return id;
  },
});

export const detachFromTask = mutation({
  args: {
    taskId: v.id("tasks"),
    labelId: v.id("labels"),
    deviceName: v.string(),
  },
  handler: async (ctx, { taskId, labelId, deviceName }) => {
    const links = await ctx.db
      .query("taskLabels")
      .withIndex("by_task", (q) => q.eq("taskId", taskId))
      .collect();
    const link = links.find((l) => l.labelId === labelId);
    if (!link) return null;

    const label = await ctx.db.get(labelId);
    await ctx.db.delete(link._id);
    await logActivity(ctx, {
      taskId,
      deviceName,
      kind: "label_removed",
      meta: label?.name ?? "",
    });
    return null;
  },
});
