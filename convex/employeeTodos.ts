import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireIdentity } from "./lib/auth";

// GET ALL
export const list = query({
  args: {
    employeeId: v.string(),
  },
  handler: async (ctx, { employeeId }) => {
    await requireIdentity(ctx);

    return await ctx.db
      .query("employeeTodos")
      .withIndex("by_employee", (q) =>
        q.eq("employeeId", employeeId)
      )
      .collect();
  },
});

// GET BY ID
export const get = query({
  args: {
    todoId: v.id("employeeTodos"),
  },
  handler: async (ctx, { todoId }) => {
    await requireIdentity(ctx);
    return await ctx.db.get(todoId);
  },
});

// CREATE
export const create = mutation({
  args: {
    employeeId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high")
    ),
  },
  handler: async (ctx, args) => {
    await requireIdentity(ctx);

    const title = args.title.trim();
    if (!title) throw new Error("Title cannot be empty");

    return await ctx.db.insert("employeeTodos", {
      employeeId: args.employeeId,
      title,
      description: args.description?.trim(),
      priority: args.priority,
      isCompleted: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// UPDATE
export const update = mutation({
  args: {
    todoId: v.id("employeeTodos"),
    body: v.object({
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      priority: v.optional(
        v.union(v.literal("low"), v.literal("medium"), v.literal("high"))
      ),
      isCompleted: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, { todoId, body }) => {
    await requireIdentity(ctx);

    const todo = await ctx.db.get(todoId);
    if (!todo) throw new Error("Todo not found");

    const patch: any = {
      updatedAt: Date.now(),
    };

    if (body.title !== undefined) {
      const title = body.title.trim();
      if (!title) throw new Error("Title cannot be empty");
      patch.title = title;
    }

    if (body.description !== undefined) {
      patch.description = body.description?.trim();
    }

    if (body.priority !== undefined) {
      patch.priority = body.priority;
    }

    if (body.isCompleted !== undefined) {
      patch.isCompleted = body.isCompleted;
    }

    await ctx.db.patch(todoId, patch);
    return null;
  },
});

// DELETE
export const remove = mutation({
  args: {
    todoId: v.id("employeeTodos"),
  },
  handler: async (ctx, { todoId }) => {
    await requireIdentity(ctx);

    const todo = await ctx.db.get(todoId);
    if (!todo) throw new Error("Todo not found");

    await ctx.db.delete(todoId);
    return null;
  },
});