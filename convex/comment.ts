import { v } from 'convex/values'
import { privateMutation, privateQuery } from './helpers/customFunctions'
import { vv } from './schema'

export const listByTask = privateQuery({
  args: {
    taskId: vv.id('tasks'),
  },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query('comments')
      .withIndex('by_task', (q) => q.eq('taskId', args.taskId))
      .collect()
    return comments.sort((a, b) => a._creationTime - b._creationTime)
  },
})

export const create = privateMutation({
  args: {
    taskId: vv.id('tasks'),
    parentCommentId: v.union(vv.id('comments'), v.null()),
    deviceName: v.string(),
    body: v.any(),
  },
  handler: async (ctx, args) => {
    if (args.parentCommentId) {
      const parent = await ctx.db.get(args.parentCommentId)
      if (!parent) {
        throw new Error('Parent comment not found')
      }
      // Only one level of nesting: replies always sit under a root.
      if (parent.parentCommentId !== null) {
        throw new Error('Replies can only be added to a root comment')
      }
    }
    return await ctx.db.insert('comments', {
      taskId: args.taskId,
      parentCommentId: args.parentCommentId,
      deviceName: args.deviceName,
      body: args.body,
    })
  },
})

export const edit = privateMutation({
  args: {
    commentId: vv.id('comments'),
    body: v.any(),
    deviceName: v.string(),
  },
  handler: async (ctx, args) => {
    const comment = await ctx.db.get(args.commentId)
    if (!comment) throw new Error('Comment not found')
    if (comment.deviceName !== args.deviceName) {
      throw new Error('You can only edit your own comments')
    }

    if (JSON.stringify(args.body) === JSON.stringify(comment.body)) return
    await ctx.db.patch(args.commentId, {
      body: args.body,
      editedAt: Date.now(),
    })
  },
})

export const remove = privateMutation({
  args: {
    commentId: vv.id('comments'),
    deviceName: v.string(),
  },
  handler: async (ctx, args) => {
    const comment = await ctx.db.get(args.commentId)
    if (!comment) return
    if (comment.deviceName !== args.deviceName) {
      throw new Error('You can only delete your own comments')
    }
    // If the root is removed, drop its replies as well.
    if (comment.parentCommentId === null) {
      const taskComments = await ctx.db
        .query('comments')
        .withIndex('by_task', (q) => q.eq('taskId', comment.taskId))
        .collect()
      const replies = taskComments.filter(
        (c) => c.parentCommentId === comment._id,
      )
      await Promise.all(replies.map((r) => ctx.db.delete(r._id)))
    }
    await ctx.db.delete(args.commentId)
  },
})

export const toggleResolution = privateMutation({
  args: {
    commentId: vv.id('comments'),
  },
  handler: async (ctx, args) => {
    const comment = await ctx.db.get(args.commentId)
    if (!comment) throw new Error('Comment not found')

    const rootId = comment.parentCommentId ?? comment._id
    const taskComments = await ctx.db
      .query('comments')
      .withIndex('by_task', (q) => q.eq('taskId', comment.taskId))
      .collect()
    const inThread = taskComments.filter(
      (c) => (c.parentCommentId ?? c._id) === rootId,
    )

    const willResolve = !comment.isResolution

    // Only one comment per thread can be the resolution; clear any others first.
    await Promise.all(
      inThread
        .filter((c) => c._id !== args.commentId && c.isResolution)
        .map((c) => ctx.db.patch(c._id, { isResolution: false })),
    )

    await ctx.db.patch(args.commentId, { isResolution: willResolve })
  },
})
