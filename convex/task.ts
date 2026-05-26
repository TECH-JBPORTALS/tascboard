import { mutation, query, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { Id } from "./_generated/dataModel";
import { requireIdentity } from "./lib/auth";
import {
  actorDisplayName,
  formatTaskDate,
  logTaskActivity,
} from "./lib/taskActivityLog";
import { taskStatusLabels, taskPriorityLabels } from "./lib/taskDisplay";
import { getTrackMembers } from "./lib/memberHelper";
import { TaskValidator } from "./schema";

/**
 * Create Task
 */
export const create = mutation({
  args: TaskValidator.omit("taskCode", "createdAt", "updatedAt", "createdBy"),
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const lastTask = await ctx.db
      .query("tasks")
      .withIndex("by_track", (q) => q.eq("trackId", args.trackId))
      .order("desc")
      .first();

    const taskId = await ctx.db.insert("tasks", {
      trackId: args.trackId,
      projectId: args.projectId,
      // Find the next task number based on the previous task count in the track.
      taskCode: (lastTask ? parseInt(lastTask.taskCode) + 1 : 1).toString(),
      title: args.title.trim(),
      description: args.description,
      status: args.status,
      createdBy: identity.userId,
      priority: args.priority,
      complexity: args.complexity,
      dueDate: args.dueDate,
      startedAt: args.status === "in_progress" ? Date.now() : undefined,
      completedAt: args.status === "done" ? Date.now() : undefined,
      createdAt: Date.now(),
    });

    await logTaskActivity(ctx, {
      taskId,
      actorUserId: identity.userId,
      actorName: actorDisplayName(identity),
      kind: "created",
      toValue: args.title.trim(),
    });

    return taskId;
  },
});

/**
 * Get Task by ID
 */
export const get = query({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, { taskId }) => {
    await requireIdentity(ctx);

    const task = await ctx.db.get(taskId);
    if (!task) return null;

    const track = await ctx.db.get(task.trackId);
    const project = track ? await ctx.db.get(track.projectId) : null;

    const taskLabelLinks = await ctx.db
      .query("taskLabels")
      .withIndex("by_task", (q) => q.eq("taskId", taskId))
      .collect();

    const labels = (
      await Promise.all(taskLabelLinks.map((l) => ctx.db.get(l.labelId)))
    ).filter((l): l is Doc<"labels"> => l !== null);
    const { members } = await getTrackMembers(ctx, task.trackId);
    return {
      ...task,
      track,
      project,
      labels,
      members,
    };
  },
});

/**
 * List Tasks by Track
 */
export const listByTrack = query({
  args: {
    trackId: v.id("tracks"),
  },
  handler: async (ctx, args) => {
    await requireIdentity(ctx);

    return await ctx.db
      .query("tasks")
      .withIndex("by_track", (q) => q.eq("trackId", args.trackId))
      .collect();
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const tasks = await ctx.db.query("tasks").order("desc").collect();

    return await Promise.all(
      tasks.map(async (task) => {
        const track = await ctx.db.get(task.trackId);

        const project = track ? await ctx.db.get(track.projectId) : null;

        const taskLabelLinks = await ctx.db
          .query("taskLabels")
          .withIndex("by_task", (q) => q.eq("taskId", task._id))
          .collect();

        const labels = (
          await Promise.all(taskLabelLinks.map((l) => ctx.db.get(l.labelId)))
        ).filter((l): l is Doc<"labels"> => l !== null);
        const { members } = await getTrackMembers(ctx, task.trackId);
        return {
          ...task,
          track,
          project,
          labels,
          members,
        };
      }),
    );
  },
});

/** Update Task */
export const update = mutation({
  args: {
    taskId: v.id("tasks"),
    body: TaskValidator.omit(
      "trackId",
      "projectId",
      "taskCode",
      "createdAt",
      "updatedAt",
    ).partial(),
  },
  handler: async (ctx, { taskId, body }) => {
    const identity = await requireIdentity(ctx);

    const task = await ctx.db.get(taskId);

    if (!task) {
      throw new Error("Task not found");
    }

    const actorUserId = identity.userId;
    const actorName = actorDisplayName(identity);
    const patch: Partial<Doc<"tasks">> = {};

    if (body.title !== undefined) {
      const trimmed = body.title.trim();
      if (!trimmed) throw new Error("Task title cannot be empty");
      if (trimmed !== task.title) {
        patch.title = trimmed;
        await logTaskActivity(ctx, {
          taskId,
          actorUserId,
          actorName,
          kind: "title_changed",
          fromValue: task.title,
          toValue: trimmed,
        });
      }
    }

    if (body.description !== undefined) {
      patch.description = body.description;
    }

    if (body.status !== undefined && body.status !== task.status) {
      patch.status = body.status;
      await logTaskActivity(ctx, {
        taskId,
        actorUserId,
        actorName,
        kind: "status_changed",
        fromValue: taskStatusLabels[task.status] ?? task.status,
        toValue: taskStatusLabels[body.status] ?? body.status,
      });
    }

    if (body.priority !== undefined && body.priority !== task.priority) {
      patch.priority = body.priority;
      await logTaskActivity(ctx, {
        taskId,
        actorUserId,
        actorName,
        kind: "priority_changed",
        fromValue: taskPriorityLabels[task.priority] ?? task.priority,
        toValue: taskPriorityLabels[body.priority] ?? body.priority,
      });
    }

    if (body.complexity !== undefined) patch.complexity = body.complexity;

    if (body.dueDate !== task.dueDate) {
      patch.dueDate = body.dueDate;
      await logTaskActivity(ctx, {
        taskId,
        actorUserId,
        actorName,
        kind: "due_date_changed",
        fromValue: task.dueDate ? formatTaskDate(task.dueDate) : "",
        toValue: body.dueDate ? formatTaskDate(body.dueDate) : "Unset",
      });
    }

    if (body.sprintId !== undefined) {
      patch.sprintId = body.sprintId ?? undefined;
    }

    if (Object.keys(patch).length === 0) {
      return null;
    }

    patch.updatedAt = Date.now();
    await ctx.db.patch(taskId, patch);

    return null;
  },
});

export const updateDescription = mutation({
  args: {
    taskId: v.id("tasks"),
    description: v.any(),
  },
  returns: v.null(),
  handler: async (ctx, { taskId, description }) => {
    await requireIdentity(ctx);

    const task = await ctx.db.get(taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    await ctx.db.patch(taskId, {
      description,
      updatedAt: Date.now(),
    });

    return null;
  },
});

/** CASCADE DELETE */
export async function removeTaskCascade(ctx: MutationCtx, taskId: Id<"tasks">) {
  const subtasks = await ctx.db
    .query("subtasks")
    .withIndex("by_task_and_order", (q) => q.eq("taskId", taskId))
    .collect();

  await Promise.all(subtasks.map((s) => ctx.db.delete(s._id)));

  const labelLinks = await ctx.db
    .query("taskLabels")
    .withIndex("by_task", (q) => q.eq("taskId", taskId))
    .collect();

  await Promise.all(labelLinks.map((l) => ctx.db.delete(l._id)));

  const activities = await ctx.db
    .query("taskActivities")
    .withIndex("by_task", (q) => q.eq("taskId", taskId))
    .collect();

  await Promise.all(activities.map((a) => ctx.db.delete(a._id)));

  const comments = await ctx.db
    .query("comments")
    .withIndex("by_task", (q) => q.eq("taskId", taskId))
    .collect();

  await Promise.all(comments.map((c) => ctx.db.delete(c._id)));

  await ctx.db.delete(taskId);
}

/** REMOVE TASK */
export const remove = mutation({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, { taskId }) => {
    const task = await ctx.db.get(taskId);

    if (!task) {
      throw new Error("Task not found");
    }

    await removeTaskCascade(ctx, taskId);

    return null;
  },
});
