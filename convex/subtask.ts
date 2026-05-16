import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listByTask = query({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, { taskId }) => {
    return await ctx.db
      .query("subtasks")
      .withIndex("by_task_and_order", (q) => q.eq("taskId", taskId))
      .collect();
  },
});

export const create = mutation({
  args: {
    taskId: v.id("tasks"),
    title: v.string(),
    deviceName: v.string(),
  },
  handler: async (ctx, { taskId, title }) => {
    const siblings = await ctx.db
      .query("subtasks")
      .withIndex("by_task_and_order", (q) => q.eq("taskId", taskId))
      .collect();
    const order =
      siblings.reduce((max, s) => Math.max(max, s.order), -1) + 1;

    return await ctx.db.insert("subtasks", {
      taskId,
      title,
      completed: false,
      order,
    });
  },
});

export const toggle = mutation({
  args: {
    subtaskId: v.id("subtasks"),
    deviceName: v.string(),
  },
  handler: async (ctx, { subtaskId }) => {
    const subtask = await ctx.db.get(subtaskId);
    if (!subtask) throw new Error("Subtask not found");
    await ctx.db.patch(subtaskId, { completed: !subtask.completed });
  },
});

export const rename = mutation({
  args: {
    subtaskId: v.id("subtasks"),
    title: v.string(),
    deviceName: v.string(),
  },
  handler: async (ctx, { subtaskId, title }) => {
    const subtask = await ctx.db.get(subtaskId);
    if (!subtask) throw new Error("Subtask not found");
    if (subtask.title === title) return;
    await ctx.db.patch(subtaskId, { title });
  },
});

export const remove = mutation({
  args: {
    subtaskId: v.id("subtasks"),
    deviceName: v.string(),
  },
  handler: async (ctx, { subtaskId }) => {
    const subtask = await ctx.db.get(subtaskId);
    if (!subtask) return;
    await ctx.db.delete(subtaskId);
  },
});
