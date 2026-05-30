import { v } from 'convex/values'
import { privateMutation, privateQuery } from './lib/customFunctions'

const subtaskReturn = v.object({
  _id: v.id('subtasks'),
  _creationTime: v.number(),
  taskId: v.id('tasks'),
  title: v.string(),
  completed: v.boolean(),
  order: v.number(),
})

export const listByTask = privateQuery({
  args: {
    taskId: v.id('tasks'),
  },
  returns: v.array(subtaskReturn),
  handler: async (ctx, args) => {
    return await ctx.db
      .query('subtasks')
      .withIndex('by_task_and_order', (q) => q.eq('taskId', args.taskId))
      .collect()
  },
})

export const create = privateMutation({
  args: {
    taskId: v.id('tasks'),
    title: v.string(),
    deviceName: v.string(),
  },
  returns: v.id('subtasks'),
  handler: async (ctx, args) => {
    const trimmed = args.title.trim()

    if (!trimmed) {
      throw new Error('Subtask title cannot be empty')
    }
    const siblings = await ctx.db
      .query('subtasks')
      .withIndex('by_task_and_order', (q) => q.eq('taskId', args.taskId))
      .collect()
    const order =
      siblings.reduce((max, subtask) => Math.max(max, subtask.order), -1) + 1
    return await ctx.db.insert('subtasks', {
      taskId: args.taskId,
      title: trimmed,
      completed: false,
      order,
    })
  },
})

export const toggle = privateMutation({
  args: {
    subtaskId: v.id('subtasks'),
    deviceName: v.string(),
  },
  handler: async (ctx, args) => {
    const subtask = await ctx.db.get(args.subtaskId)

    if (!subtask) {
      throw new Error('Subtask not found')
    }

    await ctx.db.patch(args.subtaskId, {
      completed: !subtask.completed,
    })

    return null
  },
})

export const rename = privateMutation({
  args: {
    subtaskId: v.id('subtasks'),
    title: v.string(),
    deviceName: v.string(),
  },
  handler: async (ctx, args) => {
    const subtask = await ctx.db.get(args.subtaskId)

    if (!subtask) {
      throw new Error('Subtask not found')
    }

    const trimmed = args.title.trim()

    if (!trimmed) {
      throw new Error('Subtask title cannot be empty')
    }

    if (subtask.title === trimmed) {
      return null
    }

    await ctx.db.patch(args.subtaskId, {
      title: trimmed,
    })

    return null
  },
})

export const remove = privateMutation({
  args: {
    subtaskId: v.id('subtasks'),
    deviceName: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const subtask = await ctx.db.get(args.subtaskId)

    if (!subtask) {
      throw new Error('Subtask not found')
    }

    await ctx.db.delete(args.subtaskId)

    return null
  },
})
