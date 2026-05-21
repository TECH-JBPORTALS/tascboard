import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireIdentity } from "./lib/auth";

function isEmptyPlateBody(body: unknown): boolean {
  if (body === null || body === undefined) return true;
  if (typeof body === "string") return body.trim().length === 0;
  if (Array.isArray(body)) {
    if (body.length === 0) return true;
    return body.every(
      (node) =>
        typeof node === "object" &&
        node !== null &&
        "children" in node &&
        Array.isArray((node as { children: unknown[] }).children) &&
        (node as { children: { text?: string }[] }).children.every(
          (child) => !child.text || child.text.trim() === "",
        ),
    );
  }
  return false;
}

export const listByTask = query({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, { taskId }) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_task", (q) => q.eq("taskId", taskId))
      .collect();
    return comments.sort((a, b) => a._creationTime - b._creationTime);
  },
});

export const create = mutation({
  args: {
    taskId: v.id("tasks"),
    parentCommentId: v.union(v.id("comments"), v.null()),
    deviceName: v.string(),
    body: v.any(),
  },
  handler: async (ctx, { taskId, parentCommentId, deviceName, body }) => {
    await requireIdentity(ctx);

    if (isEmptyPlateBody(body)) {
      throw new Error("Comment body cannot be empty");
    }
    if (parentCommentId) {
      const parent = await ctx.db.get(parentCommentId);
      if (!parent) {
        throw new Error("Parent comment not found");
      }
      // Only one level of nesting: replies always sit under a root.
      if (parent.parentCommentId !== null) {
        throw new Error("Replies can only be added to a root comment");
      }
    }
    return await ctx.db.insert("comments", {
      taskId,
      parentCommentId,
      deviceName,
      body,
    });
  },
});

export const edit = mutation({
  args: {
    commentId: v.id("comments"),
    body: v.any(),
    deviceName: v.string(),
  },
  handler: async (ctx, { commentId, body, deviceName }) => {
    await requireIdentity(ctx);

    const comment = await ctx.db.get(commentId);
    if (!comment) throw new Error("Comment not found");
    if (comment.deviceName !== deviceName) {
      throw new Error("You can only edit your own comments");
    }
    if (isEmptyPlateBody(body)) {
      throw new Error("Comment body cannot be empty");
    }
    if (JSON.stringify(body) === JSON.stringify(comment.body)) return;
    await ctx.db.patch(commentId, { body, editedAt: Date.now() });
  },
});

export const remove = mutation({
  args: {
    commentId: v.id("comments"),
    deviceName: v.string(),
  },
  handler: async (ctx, { commentId, deviceName }) => {
    await requireIdentity(ctx);

    const comment = await ctx.db.get(commentId);
    if (!comment) return;
    if (comment.deviceName !== deviceName) {
      throw new Error("You can only delete your own comments");
    }
    // If the root is removed, drop its replies as well.
    if (comment.parentCommentId === null) {
      const taskComments = await ctx.db
        .query("comments")
        .withIndex("by_task", (q) => q.eq("taskId", comment.taskId))
        .collect();
      const replies = taskComments.filter(
        (c) => c.parentCommentId === commentId,
      );
      await Promise.all(replies.map((r) => ctx.db.delete(r._id)));
    }
    await ctx.db.delete(commentId);
  },
});

export const toggleResolution = mutation({
  args: {
    commentId: v.id("comments"),
  },
  handler: async (ctx, { commentId }) => {
    await requireIdentity(ctx);

    const comment = await ctx.db.get(commentId);
    if (!comment) throw new Error("Comment not found");

    const rootId = comment.parentCommentId ?? comment._id;
    const taskComments = await ctx.db
      .query("comments")
      .withIndex("by_task", (q) => q.eq("taskId", comment.taskId))
      .collect();
    const inThread = taskComments.filter(
      (c) => (c.parentCommentId ?? c._id) === rootId,
    );

    const willResolve = !comment.isResolution;

    // Only one comment per thread can be the resolution; clear any others first.
    await Promise.all(
      inThread
        .filter((c) => c._id !== commentId && c.isResolution)
        .map((c) => ctx.db.patch(c._id, { isResolution: false })),
    );

    await ctx.db.patch(commentId, { isResolution: willResolve });
  },
});
