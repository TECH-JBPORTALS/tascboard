import { internalMutation, mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";

const sprintStatusValidator = v.union(
  v.literal("planned"),
  v.literal("active"),
  v.literal("completed"),
);

const sprintReturn = v.object({
  _id: v.id("sprints"),
  _creationTime: v.number(),
  trackId: v.id("tracks"),
  sprintName: v.string(),
  goal: v.string(),
  startDate: v.number(),
  endDate: v.number(),
  status: sprintStatusValidator,
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
});

const taskReturn = v.object({
  _id: v.id("tasks"),
  _creationTime: v.number(),
  title: v.string(),
  description: v.optional(v.string()),
  status: v.union(
    v.literal("todo"),
    v.literal("in_progress"),
    v.literal("done"),
  ),
  priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
  dueDate: v.union(v.number(), v.null()),
  trackId: v.id("tracks"),
  sprintId: v.optional(v.union(v.id("sprints"), v.null())),
});

const sprintProgressReturn = v.object({
  sprintId: v.id("sprints"),
  trackId: v.id("tracks"),
  total: v.number(),
  done: v.number(),
  inProgress: v.number(),
  todo: v.number(),
  progress: v.number(),
});

const burndownPointReturn = v.object({
  date: v.number(),
  ideal: v.number(),
  remaining: v.number(),
});

const burndownReturn = v.object({
  sprintId: v.id("sprints"),
  totalTasks: v.number(),
  doneTasks: v.number(),
  burndown: v.array(burndownPointReturn),
});

async function requireUserId(ctx: {
  auth: { getUserIdentity: () => Promise<unknown> };
}) {
  const identity = (await ctx.auth.getUserIdentity()) as {
    tokenIdentifier: string;
  } | null;

  if (!identity) {
    throw new Error("Not authenticated");
  }
  return identity.tokenIdentifier;
}

async function getSprintOrThrow(ctx: { db: { get: (id: Id<"sprints">) => Promise<Doc<"sprints"> | null> } }, sprintId: Id<"sprints">) {
  const sprint = await ctx.db.get(sprintId);
  if (!sprint) {
    throw new Error("Sprint not found");
  }
  return sprint;
}

function validateSprintFields(sprintName: string, goal: string, startDate: number, endDate: number) {
  const trimmedSprintName = sprintName.trim();
  const trimmedGoal = goal.trim();

  if (trimmedSprintName.length === 0) {
    throw new Error("Sprint name cannot be empty");
  }

  if (trimmedGoal.length === 0) {
    throw new Error("Goal cannot be empty");
  }

  if (startDate > endDate) {
    throw new Error("Start date cannot be after end date");
  }

  return { trimmedSprintName, trimmedGoal };
}

async function insertSprint(
  ctx: MutationCtx,
  args: {
    trackId: Id<"tracks">;
    sprintName: string;
    goal: string;
    startDate: number;
    endDate: number;
  },
) {
  const track = await ctx.db.get(args.trackId);
  if (!track) {
    throw new Error("Track not found");
  }

  const { trimmedSprintName, trimmedGoal } = validateSprintFields(
    args.sprintName,
    args.goal,
    args.startDate,
    args.endDate,
  );

  return await ctx.db.insert("sprints", {
    trackId: args.trackId,
    sprintName: trimmedSprintName,
    goal: trimmedGoal,
    startDate: args.startDate,
    endDate: args.endDate,
    status: "planned",
    createdAt: Date.now(),
  });
}

export const createSprint = internalMutation({
  args: {
    trackId: v.id("tracks"),
    sprintName: v.string(),
    goal: v.string(),
    startDate: v.number(),
    endDate: v.number(),
  },
  returns: v.id("sprints"),
  handler: async (ctx, args) => insertSprint(ctx, args),
});

export const create = mutation({
  args: {
    trackId: v.id("tracks"),
    sprintName: v.string(),
    goal: v.string(),
    startDate: v.number(),
    endDate: v.number(),
  },
  returns: v.id("sprints"),
  handler: async (ctx, args) => {
    await requireUserId(ctx);
    return await insertSprint(ctx, args);
  },
});

export const list = query({
  args: { trackId: v.id("tracks") },
  returns: v.array(sprintReturn),
  handler: async (ctx, args) => {
    await requireUserId(ctx);

    return await ctx.db
      .query("sprints")
      .withIndex("by_track", (q) => q.eq("trackId", args.trackId))
      .order("desc")
      .take(100);
  },
});

export const get = query({
  args: { sprintId: v.id("sprints") },
  returns: sprintReturn,
  handler: async (ctx, args) => {
    await requireUserId(ctx);
    return await getSprintOrThrow(ctx, args.sprintId);
  },
});

export const edit = mutation({
  args: {
    sprintId: v.id("sprints"),
    sprintName: v.string(),
    goal: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    status: sprintStatusValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireUserId(ctx);
    const sprint = await getSprintOrThrow(ctx, args.sprintId);

    const { trimmedSprintName, trimmedGoal } = validateSprintFields(
      args.sprintName,
      args.goal,
      args.startDate,
      args.endDate,
    );

    const isUnchanged =
      trimmedSprintName === sprint.sprintName &&
      trimmedGoal === sprint.goal &&
      args.startDate === sprint.startDate &&
      args.endDate === sprint.endDate &&
      args.status === sprint.status;

    if (isUnchanged) {
      return null;
    }

    await ctx.db.patch(args.sprintId, {
      sprintName: trimmedSprintName,
      goal: trimmedGoal,
      startDate: args.startDate,
      endDate: args.endDate,
      status: args.status,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const remove = mutation({
  args: { sprintId: v.id("sprints") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireUserId(ctx);
    await getSprintOrThrow(ctx, args.sprintId);

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_sprint", (q) => q.eq("sprintId", args.sprintId))
      .take(100);

    for (const task of tasks) {
      await ctx.db.patch(task._id, { sprintId: null });
    }

    await ctx.db.delete(args.sprintId);
    return null;
  },
});

export const addTaskToSprint = mutation({
  args: {
    taskId: v.id("tasks"),
    sprintId: v.id("sprints"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireUserId(ctx);

    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    const sprint = await getSprintOrThrow(ctx, args.sprintId);

    if (task.trackId !== sprint.trackId) {
      throw new Error("Task and sprint must belong to the same track");
    }

    if (task.sprintId === args.sprintId) {
      return null;
    }

    await ctx.db.patch(args.taskId, { sprintId: args.sprintId });
    return null;
  },
});

export const removeTaskFromSprint = mutation({
  args: { taskId: v.id("tasks") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireUserId(ctx);

    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new Error("Not found");
    }

    if (task.sprintId === undefined || task.sprintId === null) {
      return null;
    }

    await ctx.db.patch(args.taskId, { sprintId: null });
    return null;
  },
});

export const getBacklog = query({
  args: { trackId: v.id("tracks") },
  returns: v.array(taskReturn),
  handler: async (ctx, args) => {
    await requireUserId(ctx);

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_track_and_sprint", (q) =>
        q.eq("trackId", args.trackId).eq("sprintId", null),
      )
      .take(200);

    return tasks;
  },
});

export const getSprintTasks = query({
  args: { sprintId: v.id("sprints") },
  returns: v.array(taskReturn),
  handler: async (ctx, args) => {
    await requireUserId(ctx);
    await getSprintOrThrow(ctx, args.sprintId);

    return await ctx.db
      .query("tasks")
      .withIndex("by_sprint", (q) => q.eq("sprintId", args.sprintId))
      .take(200);
  },
});

export const getSprintProgress = query({
  args: { sprintId: v.id("sprints") },
  returns: sprintProgressReturn,
  handler: async (ctx, args) => {
    await requireUserId(ctx);
    const sprint = await getSprintOrThrow(ctx, args.sprintId);

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_sprint", (q) => q.eq("sprintId", args.sprintId))
      .take(200);

    const total = tasks.length;
    const done = tasks.filter((t) => t.status === "done").length;
    const inProgress = tasks.filter((t) => t.status === "in_progress").length;
    const todo = tasks.filter((t) => t.status === "todo").length;
    const progress = total === 0 ? 0 : (done / total) * 100;

    return {
      sprintId: args.sprintId,
      trackId: sprint.trackId,
      total,
      done,
      inProgress,
      todo,
      progress,
    };
  },
});

export const getBurndownChart = query({
  args: { sprintId: v.id("sprints") },
  returns: burndownReturn,
  handler: async (ctx, args) => {
    await requireUserId(ctx);
    const sprint = await getSprintOrThrow(ctx, args.sprintId);

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_sprint", (q) => q.eq("sprintId", args.sprintId))
      .take(200);

    const totalTasks = tasks.length;
    const doneTasks = tasks.filter((t) => t.status === "done").length;

    const start = sprint.startDate;
    const end = sprint.endDate;
    const dayMs = 24 * 60 * 60 * 1000;
    const totalDays = Math.max(1, Math.ceil((end - start) / dayMs));

    const burndown = [];
    for (let i = 0; i <= totalDays; i++) {
      const date = start + i * dayMs;
      const idealRemaining = totalTasks - (totalTasks * i) / totalDays;
      const actualRemaining = totalTasks - doneTasks;

      burndown.push({
        date,
        ideal: Math.max(idealRemaining, 0),
        remaining: Math.max(actualRemaining, 0),
      });
    }

    return {
      sprintId: args.sprintId,
      totalTasks,
      doneTasks,
      burndown,
    };
  },
});
