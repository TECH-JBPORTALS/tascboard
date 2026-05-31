import { v } from 'convex/values'
import type { Doc } from './_generated/dataModel'
import { privateMutation, privateQuery } from './lib/customFunctions'
import { logTaskActivity } from './lib/taskActivityLog'
import { vv } from './schema'

const labelReturn = vv.doc('labels')

export const listByProject = privateQuery({
  args: {
    projectId: vv.id('projects'),
  },
  returns: v.array(labelReturn),
  handler: async (ctx, { projectId }) => {
    return await ctx.db
      .query('labels')
      .withIndex('by_project', (q) => q.eq('projectId', projectId))
      .collect()
  },
})

export const listTaskLabels = privateQuery({
  args: {
    taskId: vv.id('tasks'),
  },
  returns: v.array(labelReturn),
  handler: async (ctx, { taskId }) => {
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

export const create = privateMutation({
  args: {
    projectId: vv.id('projects'),
    name: v.string(),
    color: v.string(),
  },
  returns: vv.id('labels'),
  handler: async (ctx, args) => {
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

export const get = privateQuery({
  args: {
    labelId: vv.id('labels'),
  },
  returns: v.union(labelReturn, v.null()),
  handler: async (ctx, { labelId }) => {
    const label = await ctx.db.get(labelId)

    if (!label) {
      return null
    }

    return label
  },
})

export const update = privateMutation({
  args: {
    labelId: vv.id('labels'),
    body: v.object({
      name: v.optional(v.string()),
      color: v.optional(v.string()),
    }),
  },
  returns: v.null(),
  handler: async (ctx, { labelId, body }) => {
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

export const remove = privateMutation({
  args: {
    labelId: vv.id('labels'),
  },
  returns: v.null(),
  handler: async (ctx, { labelId }) => {
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

export const attachToTask = privateMutation({
  args: {
    taskId: vv.id('tasks'),
    labelId: vv.id('labels'),
    deviceName: v.string(),
  },
  returns: v.union(vv.id('taskLabels'), v.null()),
  handler: async (ctx, { taskId, labelId }) => {
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
      actorUserId: ctx.session.userId,
      actorName: ctx.session.user.name,
      kind: 'label_added',
      toValue: label.name,
      meta: label.color,
    })

    return linkId
  },
})

export const detachFromTask = privateMutation({
  args: {
    taskId: vv.id('tasks'),
    labelId: vv.id('labels'),
    deviceName: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, { taskId, labelId }) => {
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
        actorUserId: ctx.session.userId,
        actorName: ctx.session.user.name,
        kind: 'label_removed',
        fromValue: label.name,
        meta: label.color,
      })
    }

    return null
  },
})
