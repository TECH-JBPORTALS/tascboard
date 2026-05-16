import { mutation, query, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";

const statusValidator = v.union(
  v.literal("todo"),
  v.literal("in_progress"),
  v.literal("done"),
);

const priorityValidator = v.union(
  v.literal("low"),
  v.literal("medium"),
  v.literal("high"),
);

export type ActivityKind = Doc<"activities">["kind"];

// Separator we use to pack multiple label names into a single `meta` string.
// Newlines are extremely unlikely in label names, so splitting on this is safe.
export const LABEL_META_SEPARATOR = "\n";

function parseLabelMeta(meta: string | undefined): string[] {
  if (!meta) return [];
  return meta.split(LABEL_META_SEPARATOR).filter((s) => s.length > 0);
}

function serializeLabelMeta(labels: string[]): string {
  return labels.join(LABEL_META_SEPARATOR);
}

// Activity kinds where consecutive edits by the same device should consolidate
// into a single log entry (instead of creating a new one for every keystroke
// or rapid back-and-forth).
const MERGEABLE_KINDS = new Set<ActivityKind>([
  "title_changed",
  "status_changed",
  "priority_changed",
  "due_date_changed",
]);

const LABEL_KINDS = new Set<ActivityKind>(["label_added", "label_removed"]);

export async function logActivity(
  ctx: MutationCtx,
  args: {
    taskId: Id<"tasks">;
    deviceName: string;
    kind: ActivityKind;
    fromValue?: string;
    toValue?: string;
    meta?: string;
  },
) {
  if (LABEL_KINDS.has(args.kind)) {
    await logLabelActivity(ctx, args);
    return;
  }

  if (MERGEABLE_KINDS.has(args.kind)) {
    const latest = await ctx.db
      .query("activities")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .order("desc")
      .first();

    if (
      latest &&
      latest.deviceName === args.deviceName &&
      latest.kind === args.kind
    ) {
      // Reverted back to where it started — drop the entry entirely.
      if (latest.fromValue === args.toValue) {
        await ctx.db.delete(latest._id);
        return;
      }
      // Net effect is identical — keep the old entry as-is.
      if (latest.toValue === args.toValue) {
        return;
      }
      // Same device editing the same field again: replace the entry,
      // preserving the original "from" value and bumping it to "now".
      await ctx.db.delete(latest._id);
      await ctx.db.insert("activities", {
        taskId: args.taskId,
        deviceName: args.deviceName,
        kind: args.kind,
        fromValue: latest.fromValue,
        toValue: args.toValue,
        meta: args.meta,
      });
      return;
    }
  }

  await ctx.db.insert("activities", {
    taskId: args.taskId,
    deviceName: args.deviceName,
    kind: args.kind,
    fromValue: args.fromValue,
    toValue: args.toValue,
    meta: args.meta,
  });
}

// Coalesces label_added / label_removed entries so:
//   - Consecutive adds (or removes) by the same device collapse into one
//     entry with all label names listed in `meta`.
//   - An add immediately followed by a remove of the same label (same device)
//     cancels the pair out, and vice versa.
async function logLabelActivity(
  ctx: MutationCtx,
  args: {
    taskId: Id<"tasks">;
    deviceName: string;
    kind: ActivityKind;
    meta?: string;
  },
) {
  const incoming = parseLabelMeta(args.meta);
  if (incoming.length === 0) return;

  const latest = await ctx.db
    .query("activities")
    .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
    .order("desc")
    .first();

  if (
    latest &&
    latest.deviceName === args.deviceName &&
    LABEL_KINDS.has(latest.kind)
  ) {
    const existing = parseLabelMeta(latest.meta);

    if (latest.kind === args.kind) {
      const set = new Set(existing);
      for (const label of incoming) set.add(label);
      const merged = Array.from(set);
      if (merged.length === existing.length) return; // nothing new

      await ctx.db.delete(latest._id);
      await ctx.db.insert("activities", {
        taskId: args.taskId,
        deviceName: args.deviceName,
        kind: args.kind,
        meta: serializeLabelMeta(merged),
      });
      return;
    }

    // Opposite kind: cancel any labels that appear in both directions.
    const cancelled = new Set(incoming.filter((l) => existing.includes(l)));
    const remainingInLatest = existing.filter((l) => !cancelled.has(l));
    const remainingIncoming = incoming.filter((l) => !cancelled.has(l));

    if (remainingInLatest.length === 0) {
      await ctx.db.delete(latest._id);
    } else if (remainingInLatest.length !== existing.length) {
      await ctx.db.patch(latest._id, {
        meta: serializeLabelMeta(remainingInLatest),
      });
    }

    if (remainingIncoming.length === 0) return;
    await ctx.db.insert("activities", {
      taskId: args.taskId,
      deviceName: args.deviceName,
      kind: args.kind,
      meta: serializeLabelMeta(remainingIncoming),
    });
    return;
  }

  await ctx.db.insert("activities", {
    taskId: args.taskId,
    deviceName: args.deviceName,
    kind: args.kind,
    meta: serializeLabelMeta(incoming),
  });
}

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    status: statusValidator,
    priority: priorityValidator,
    dueDate: v.nullable(v.number()),
    trackId: v.id("tracks"),
    deviceName: v.string(),
  },
  handler: async (ctx, args) => {
    const { deviceName, ...taskData } = args;
    const taskId = await ctx.db.insert("tasks", taskData);
    await logActivity(ctx, {
      taskId,
      deviceName,
      kind: "created",
      toValue: taskData.title,
    });
    return taskId;
  },
});

export const getAllByTrack = query({
  args: {
    trackId: v.id("tracks"),
  },
  handler: async (ctx, { trackId }) => {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_track", (q) => q.eq("trackId", trackId))
      .collect();

    return Promise.all(
      tasks.map(async (task) => {
        const taskLabelLinks = await ctx.db
          .query("taskLabels")
          .withIndex("by_task", (q) => q.eq("taskId", task._id))
          .collect();
        const labels = (
          await Promise.all(
            taskLabelLinks.map((link) => ctx.db.get(link.labelId)),
          )
        ).filter((l): l is Doc<"labels"> => l !== null);
        return { ...task, labels };
      }),
    );
  },
});

export const get = query({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, { taskId }) => {
    const task = await ctx.db.get(taskId);
    if (!task) return null;
    const track = await ctx.db.get(task.trackId);
    const project = track ? await ctx.db.get(track.projectId) : null;

    const taskLabelLinks = await ctx.db
      .query("taskLabels")
      .withIndex("by_task", (q) => q.eq("taskId", taskId))
      .collect();
    const labels = (
      await Promise.all(taskLabelLinks.map((link) => ctx.db.get(link.labelId)))
    ).filter((l): l is Doc<"labels"> => l !== null);

    return { ...task, track, project, labels };
  },
});

export const update = mutation({
  args: {
    taskId: v.id("tasks"),
    deviceName: v.string(),
    body: v.object({
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      status: v.optional(statusValidator),
      priority: v.optional(priorityValidator),
      dueDate: v.optional(v.nullable(v.number())),
    }),
  },
  handler: async (ctx, { taskId, deviceName, body }) => {
    const task = await ctx.db.get(taskId);
    if (!task) throw new Error("Task not found");

    if (body.title !== undefined && body.title !== task.title) {
      await logActivity(ctx, {
        taskId,
        deviceName,
        kind: "title_changed",
        fromValue: task.title,
        toValue: body.title,
      });
    }

    if (body.status !== undefined && body.status !== task.status) {
      await logActivity(ctx, {
        taskId,
        deviceName,
        kind: "status_changed",
        fromValue: task.status,
        toValue: body.status,
      });
    }

    if (body.priority !== undefined && body.priority !== task.priority) {
      await logActivity(ctx, {
        taskId,
        deviceName,
        kind: "priority_changed",
        fromValue: task.priority,
        toValue: body.priority,
      });
    }

    if (body.dueDate !== undefined && body.dueDate !== task.dueDate) {
      await logActivity(ctx, {
        taskId,
        deviceName,
        kind: "due_date_changed",
        fromValue: task.dueDate != null ? String(task.dueDate) : "",
        toValue: body.dueDate != null ? String(body.dueDate) : "",
      });
    }

    await ctx.db.patch(taskId, body);
  },
});

// Cascade-deletes a task along with everything that points at it: subtasks,
// label links, activities, and comments. Safe to call from any mutation.
export async function removeTaskCascade(
  ctx: MutationCtx,
  taskId: Id<"tasks">,
) {
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
    .query("activities")
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

export const remove = mutation({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, { taskId }) => {
    await removeTaskCascade(ctx, taskId);
  },
});
