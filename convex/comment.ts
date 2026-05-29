import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireIdentity } from './lib/auth'

function collectText(value: unknown): string {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.map(collectText).join('\n')
  if (!value || typeof value !== 'object') return ''

  const node = value as {
    text?: unknown
    children?: unknown
    content?: unknown
  }

  const ownText = typeof node.text === 'string' ? node.text : ''
  const fromChildren = collectText(node.children)
  const fromContent = collectText(node.content)
  return [ownText, fromChildren, fromContent].filter(Boolean).join('\n')
}

function isEmptyEditorBody(body: unknown): boolean {
  if (body === null || body === undefined) return true
  if (typeof body === 'string') return body.trim().length === 0
  return collectText(body).trim().length === 0
}

export const listByTask = query({
  args: {
    taskId: v.id('tasks'),
  },
  handler: async (ctx, { taskId }) => {
    const comments = await ctx.db
      .query('comments')
      .withIndex('by_task', (q) => q.eq('taskId', taskId))
      .collect()
    return comments.sort((a, b) => a._creationTime - b._creationTime)
  },
})

export const create = mutation({
  args: {
    taskId: v.id('tasks'),
    parentCommentId: v.union(v.id('comments'), v.null()),
    deviceName: v.string(),
    body: v.any(),
  },
  handler: async (ctx, args) => {
    await requireIdentity(ctx)

    if (isEmptyEditorBody(args.body)) {
      throw new Error('Comment body cannot be empty')
    }
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

export const edit = mutation({
  args: {
    commentId: v.id('comments'),
    body: v.any(),
    deviceName: v.string(),
  },
  handler: async (ctx, args) => {
    await requireIdentity(ctx)

    const comment = await ctx.db.get(args.commentId)
    if (!comment) throw new Error('Comment not found')
    if (comment.deviceName !== args.deviceName) {
      throw new Error('You can only edit your own comments')
    }
    if (isEmptyEditorBody(args.body)) {
      throw new Error('Comment body cannot be empty')
    }
    if (JSON.stringify(args.body) === JSON.stringify(comment.body)) return
    await ctx.db.patch(args.commentId, {
      body: args.body,
      editedAt: Date.now(),
    })
  },
})

export const remove = mutation({
  args: {
    commentId: v.id('comments'),
    deviceName: v.string(),
  },
  handler: async (ctx, args) => {
    await requireIdentity(ctx)

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

export const toggleResolution = mutation({
  args: {
    commentId: v.id('comments'),
  },
  handler: async (ctx, args) => {
    await requireIdentity(ctx)

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
