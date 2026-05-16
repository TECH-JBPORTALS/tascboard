import { internalMutation,mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";

async function requireUserId(ctx: {
    auth: { getUserIdentity: () => Promise<unknown> };
  }) {
    const identity = (await ctx.auth.getUserIdentity()) as {
      tokenIdentifier: string;
    };
  
    if (!identity) {
      throw new Error("Not authenticated");
    }
    return identity.tokenIdentifier;
  }
  

  export const create = internalMutation({
    args: {
      trackId: v.id("tracks"),
      sprintName: v.string(),
      goal: v.string(),
      startDate: v.number(),
      endDate: v.number(),
    },
      handler: async (
      ctx,
      { trackId, sprintName, goal, startDate, endDate }
    ) => {
      const track = await ctx.db.get(trackId);
      if (!track) {
        throw new Error("Track not found");
      }
      const trimmedSprintName = sprintName.trim();
      const trimmedGoal = goal.trim();
      if (startDate > endDate) {
        throw new Error("Start date cannot be after end date");
      }
      return await ctx.db.insert("sprints", {
        trackId,
        sprintName: trimmedSprintName,
        goal: trimmedGoal,
        startDate,
        endDate,
        status: "planned",
        createdAt: Date.now(),
      });
    },
  });

export const edit = mutation({
  args: {
    sprintId: v.id("sprints"),
    sprintName: v.string(),
    goal: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    status: v.union(
      v.literal("planned"),
      v.literal("active"),
      v.literal("completed")
    ),
  },

  handler: async (
    ctx,
    { sprintId, sprintName, goal, startDate, endDate, status }
  ) => {
    const sprint = await ctx.db.get(sprintId);

    if (!sprint) {
      throw new Error("Sprint not found");
    }

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

    const isUnchanged =
      trimmedSprintName === sprint.sprintName &&
      trimmedGoal === sprint.goal &&
      startDate === sprint.startDate &&
      endDate === sprint.endDate &&
      status === sprint.status;

    if (isUnchanged) return;

    await ctx.db.patch(sprintId, {
      sprintName: trimmedSprintName,
      goal: trimmedGoal,
      startDate,
      endDate,
      status,
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: {
    sprintId: v.id("sprints"),
  },
  handler: async (ctx, { sprintId }) => {
    const sprint = await ctx.db.get(sprintId);
    if (!sprint) {
      throw new Error("Sprint not found");
    }
    await ctx.db.delete(sprintId);
  }
});


export const addTaskToSprint = mutation({
  args: {
    taskId: v.id("tasks"),
    sprintId: v.id("sprints"),
  },

  handler: async (ctx, { taskId, sprintId }) => {
    const task = await ctx.db.get(taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    const sprint = await ctx.db.get(sprintId);
    if (!sprint) {
      throw new Error("Sprint not found");
    }

    // This already ensures task is not from another track
    if (task.trackId !== sprint.trackId) {
      throw new Error(
        "Task and sprint must belong to the same track"
      );
    }

    return {
      success: true,
      message: "Task is valid for this sprint",
    };
  },
});

export const getBacklog = query({
  args: {
    trackId: v.id("tracks"),
  },

  handler: async (ctx, { trackId }) => {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_track", (q) =>
        q.eq("trackId", trackId)
      )
      .collect();

    return tasks;
  },
});

export const getSprintProgress = query({
  args: {
    sprintId: v.id("sprints"),
  },

  handler: async (ctx, { sprintId }) => {
    const sprint = await ctx.db.get(sprintId);

    if (!sprint) {
      throw new Error("Sprint not found");
    }

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_track", (q) =>
        q.eq("trackId", sprint.trackId)
      )
      .collect();

    const total = tasks.length;

    const done = tasks.filter(
      (t) => t.status === "done"
    ).length;

    const inProgress = tasks.filter(
      (t) => t.status === "in_progress"
    ).length;

    const todo = tasks.filter(
      (t) => t.status === "todo"
    ).length;

    const progress =
      total === 0 ? 0 : (done / total) * 100;

    return {
      sprintId,
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
  args: {
    sprintId: v.id("sprints"),
  },

  handler: async (ctx, { sprintId }) => {
    const sprint = await ctx.db.get(sprintId);

    if (!sprint) {
      throw new Error("Sprint not found");
    }

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_track", (q) =>
        q.eq("trackId", sprint.trackId)
      )
      .collect();

    const totalTasks = tasks.length;

    const doneTasks = tasks.filter(
      (t) => t.status === "done"
    ).length;

    const start = sprint.startDate;
    const end = sprint.endDate;

    const dayMs = 24 * 60 * 60 * 1000;
    const totalDays = Math.max(
      1,
      Math.ceil((end - start) / dayMs)
    );

    const result = [];

    for (let i = 0; i <= totalDays; i++) {
      const date = start + i * dayMs;

      // Ideal burndown (linear)
      const idealRemaining =
        totalTasks - (totalTasks * i) / totalDays;

      // Actual remaining (no history tracking available → snapshot)
      const actualRemaining = totalTasks - doneTasks;

      result.push({
        date,
        ideal: Math.max(idealRemaining, 0),
        remaining: Math.max(actualRemaining, 0),
      });
    }

    return {
      sprintId,
      totalTasks,
      doneTasks,
      burndown: result,
    };
  },
});