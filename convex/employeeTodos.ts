import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { requireIdentity } from "./lib/auth";

const employeeTodoReturn = v.object({
  _id: v.id("employeeTodos"),
  _creationTime: v.number(),
  employeeId: v.string(),
  title: v.string(),
  description: v.optional(v.string()),
  priority: v.union(
    v.literal("low"),
    v.literal("medium"),
    v.literal("high")
  ),
  isCompleted: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
});

// GET / LIST

export const listEmployeeTodosByEmployee = query({
  args: {
    employeeId: v.string(),
  },
  returns: v.array(employeeTodoReturn),
  handler: async (ctx, { employeeId }) => {
    await requireIdentity(ctx);
    return await ctx.db
      .query("employeeTodos")
      .withIndex("by_employee", (q) => q.eq("employeeId", employeeId))
      .collect();
  },
});

export const listEmployeeTodosByEmployeeAndStatus = query({
  args: {
    employeeId: v.string(),
    isCompleted: v.boolean(),
  },
  returns: v.array(employeeTodoReturn),
  handler: async (ctx, { employeeId, isCompleted }) => {
    await requireIdentity(ctx);
    return await ctx.db
      .query("employeeTodos")
      .withIndex("by_employee_and_status", (q) =>
        q.eq("employeeId", employeeId).eq("isCompleted", isCompleted)
      )
      .collect();
  },
});

export const getEmployeeTodo = query({
  args: {
    todoId: v.id("employeeTodos"),
  },
  returns: v.union(employeeTodoReturn, v.null()),
  handler: async (ctx, { todoId }) => {
    await requireIdentity(ctx);
    const todo = await ctx.db.get(todoId);
    return todo;
  },
});

// CREATE / INSERT

export const addEmployeeTodo = mutation({
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
  returns: v.id("employeeTodos"),
  handler: async (ctx, args) => {
    await requireIdentity(ctx);

    const trimmed = args.title.trim();
    if (!trimmed) {
      throw new Error("Employee todo title cannot be empty");
    }

    return await ctx.db.insert("employeeTodos", {
      employeeId: args.employeeId,
      title: trimmed,
      description: args.description?.trim(),
      priority: args.priority,
      isCompleted: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// UPDATE / PATCH

export const updateEmployeeTodo = mutation({
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
  returns: v.null(),
  handler: async (ctx, { todoId, body }) => {
    await requireIdentity(ctx);

    const todo = await ctx.db.get(todoId);
    if (!todo) {
      throw new Error("Employee todo not found");
    }

    const patch: Partial<Doc<"employeeTodos">> = {
      updatedAt: Date.now(),
    };

    if (body.title !== undefined) {
      const trimmed = body.title.trim();
      if (!trimmed) {
        throw new Error("Employee todo title cannot be empty");
      }
      patch.title = trimmed;
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

// TOGGLE STATUS

export const toggleEmployeeTodo = mutation({
  args: {
    todoId: v.id("employeeTodos"),
    deviceName: v.string(), // you can keep this if you use it for logging
  },
  returns: v.null(),
  handler: async (ctx, { todoId }) => {
    await requireIdentity(ctx);

    const todo = await ctx.db.get(todoId);
    if (!todo) {
      throw new Error("Employee todo not found");
    }

    await ctx.db.patch(todoId, {
      isCompleted: !todo.isCompleted,
      updatedAt: Date.now(),
    });

    return null;
  },
});

// DELETE

export const removeEmployeeTodo = mutation({
  args: {
    todoId: v.id("employeeTodos"),
    deviceName: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, { todoId }) => {
    await requireIdentity(ctx);

    const todo = await ctx.db.get(todoId);
    if (!todo) {
      throw new Error("Employee todo not found");
    }

    await ctx.db.delete(todoId);
    return null;
  },
});