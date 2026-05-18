import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { requireIdentity } from "./lib/auth";

const subtaskReturn = v.object({
  _id: v.id("subtasks"),
  _creationTime: v.number(),
  taskId: v.id("tasks"),
  title: v.string(),
  completed: v.boolean(),
  order: v.number(),
});

export const listByTask = query({
  args: {
    taskId: v.id("tasks"),
  },
  returns: v.array(subtaskReturn),
  handler: async (ctx, { taskId }) => {
    await requireIdentity(ctx);

    return await ctx.db
      .query("subtasks")
      .withIndex("by_task_and_order", (q) =>
        q.eq("taskId", taskId),
      )
      .collect();
  },
});

export const create = mutation({
  args: {
    taskId: v.id("tasks"),
    title: v.string(),
    deviceName: v.string(),
  },
  returns: v.id("subtasks"),
  handler: async (ctx, { taskId, title }) => {
    await requireIdentity(ctx);

    const trimmed = title.trim();

    if (!trimmed) {
      throw new Error("Subtask title cannot be empty");
    }

    const siblings = await ctx.db
      .query("subtasks")
      .withIndex("by_task_and_order", (q) =>
        q.eq("taskId", taskId),
      )
      .collect();

    const order =
      siblings.reduce(
        (max, subtask) => Math.max(max, subtask.order),
        -1,
      ) + 1;

    return await ctx.db.insert("subtasks", {
      taskId,
      title: trimmed,
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
  returns: v.null(),
  handler: async (ctx, { subtaskId }) => {
    await requireIdentity(ctx);

    const subtask = await ctx.db.get(subtaskId);

    if (!subtask) {
      throw new Error("Subtask not found");
    }

    await ctx.db.patch(subtaskId, {
      completed: !subtask.completed,
    });

    return null;
  },
});

export const rename = mutation({
  args: {
    subtaskId: v.id("subtasks"),
    title: v.string(),
    deviceName: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, { subtaskId, title }) => {
    await requireIdentity(ctx);

    const subtask = await ctx.db.get(subtaskId);

    if (!subtask) {
      throw new Error("Subtask not found");
    }

    const trimmed = title.trim();

    if (!trimmed) {
      throw new Error("Subtask title cannot be empty");
    }

    if (subtask.title === trimmed) {
      return null;
    }

    await ctx.db.patch(subtaskId, {
      title: trimmed,
    });

    return null;
  },
});

export const remove = mutation({
  args: {
    subtaskId: v.id("subtasks"),
    deviceName: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, { subtaskId }) => {
    await requireIdentity(ctx);

    const subtask = await ctx.db.get(subtaskId);

    if (!subtask) {
      throw new Error("Subtask not found");
    }

    await ctx.db.delete(subtaskId);

    return null;
  },
});
