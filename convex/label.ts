import { v } from 'convex/values'
import type { Doc } from './_generated/dataModel'
import { mutation, query } from './_generated/server'
import { requireIdentity } from './lib/auth'
import { actorDisplayName, logTaskActivity } from './lib/taskActivityLog'

const labelReturn = v.object({
  _id: v.id('labels'),
  _creationTime: v.number(),
  name: v.string(),
  color: v.string(),
  projectId: v.id('projects'),
})

export const listByProject = query({
  args: {
    projectId: v.id('projects'),
  },
  returns: v.array(labelReturn),
  handler: async (ctx, { projectId }) => {
    await requireIdentity(ctx)

    return await ctx.db
      .query('labels')
      .withIndex('by_project', (q) => q.eq('projectId', projectId))
      .collect()
  },
})

export const listTaskLabels = query({
  args: {
    taskId: v.id('tasks'),
  },
  returns: v.array(labelReturn),
  handler: async (ctx, { taskId }) => {
    await requireIdentity(ctx)

    const links = await ctx.db
      .query('taskLabels')
      .withIndex('by_task', (q) => q.eq('taskId', taskId))
      .collect()

    const labels = await Promise.all(
      links.map((link) => ctx.db.get(link.labelId)),
    )

    return labels.filter((label): label is Doc<'labels'> => label !== null)
  },
})

export const create = mutation({
  args: {
    projectId: v.id('projects'),
    name: v.string(),
    color: v.string(),
  },
  returns: v.id('labels'),
  handler: async (ctx, args) => {
    await requireIdentity(ctx)

    const trimmed = args.name.trim()

    if (!trimmed) {
      throw new Error('Label name cannot be empty')
    }

    return await ctx.db.insert('labels', {
      projectId: args.projectId,
      name: trimmed,
      color: args.color,
    })
  },
})

export const get = query({
  args: {
    labelId: v.id('labels'),
  },
  returns: v.union(labelReturn, v.null()),
  handler: async (ctx, { labelId }) => {
    await requireIdentity(ctx)

    const label = await ctx.db.get(labelId)

    if (!label) {
      return null
    }

    return label
  },
})

export const update = mutation({
  args: {
    labelId: v.id('labels'),
    body: v.object({
      name: v.optional(v.string()),
      color: v.optional(v.string()),
    }),
  },
  returns: v.null(),
  handler: async (ctx, { labelId, body }) => {
    await requireIdentity(ctx)

    const label = await ctx.db.get(labelId)

    if (!label) {
      throw new Error('Label not found')
    }

    const patch: Partial<Doc<'labels'>> = {}

    if (body.name !== undefined) {
      const trimmed = body.name.trim()

      if (!trimmed) {
        throw new Error('Label name cannot be empty')
      }

      patch.name = trimmed
    }

    if (body.color !== undefined) {
      patch.color = body.color
    }

    await ctx.db.patch(labelId, patch)

    return null
  },
})

export const remove = mutation({
  args: {
    labelId: v.id('labels'),
  },
  returns: v.null(),
  handler: async (ctx, { labelId }) => {
    await requireIdentity(ctx)

    const label = await ctx.db.get(labelId)

    if (!label) {
      throw new Error('Label not found')
    }

    const links = await ctx.db
      .query('taskLabels')
      .withIndex('by_label', (q) => q.eq('labelId', labelId))
      .collect()

    await Promise.all(links.map((link) => ctx.db.delete(link._id)))

    await ctx.db.delete(labelId)

    return null
  },
})

export const attachToTask = mutation({
  args: {
    taskId: v.id('tasks'),
    labelId: v.id('labels'),
    deviceName: v.string(),
  },
  returns: v.union(v.id('taskLabels'), v.null()),
  handler: async (ctx, { taskId, labelId }) => {
    const identity = await requireIdentity(ctx)

    const label = await ctx.db.get(labelId)

    if (!label) {
      throw new Error('Label not found')
    }

    const existing = await ctx.db
      .query('taskLabels')
      .withIndex('by_task', (q) => q.eq('taskId', taskId))
      .collect()

    if (existing.some((link) => link.labelId === labelId)) {
      return null
    }

    const linkId = await ctx.db.insert('taskLabels', {
      taskId,
      labelId,
    })

    await logTaskActivity(ctx, {
      taskId,
      actorUserId: identity.userId,
      actorName: actorDisplayName(identity),
      kind: 'label_added',
      toValue: label.name,
      meta: label.color,
    })

    return linkId
  },
})

export const detachFromTask = mutation({
  args: {
    taskId: v.id('tasks'),
    labelId: v.id('labels'),
    deviceName: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, { taskId, labelId }) => {
    const identity = await requireIdentity(ctx)

    const label = await ctx.db.get(labelId)

    const links = await ctx.db
      .query('taskLabels')
      .withIndex('by_task', (q) => q.eq('taskId', taskId))
      .collect()

    const link = links.find((link) => link.labelId === labelId)

    if (!link) {
      throw new Error('Task label not found')
    }

    await ctx.db.delete(link._id)

    if (label) {
      await logTaskActivity(ctx, {
        taskId,
        actorUserId: identity.userId,
        actorName: actorDisplayName(identity),
        kind: 'label_removed',
        fromValue: label.name,
        meta: label.color,
      })
    }

    return null
  },
})
