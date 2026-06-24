import { v } from 'convex/values'
import { privateMutation, privateQuery } from './helpers/customFunctions'
import { vv } from './schema'

export const create = privateMutation({
  args: {
    trackId: vv.id('tracks'),
    goal: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    status: v.optional(vv.doc('sprints').fields.status),
  },
  returns: vv.id('sprints'),
  handler: async (ctx, args) => {
    const lastSprint = await ctx.db
      .query('sprints')
      .withIndex('by_track', (q) => q.eq('trackId', args.trackId))
      .order('desc')
      .first()
    const track = await ctx.db.get(args.trackId)
    if (!track) throw new Error('Track not found')
    const goal = args.goal.trim()

    if (!goal) throw new Error('Goal cannot be empty')
    if (goal.length > 160) {
      throw new Error('Goal must be 160 characters or fewer')
    }
    if (args.endDate <= args.startDate) {
      throw new Error('End date must be after the start date')
    }

    return await ctx.db.insert('sprints', {
      trackId: args.trackId,
      sprintNumber: lastSprint ? lastSprint.sprintNumber + 1 : 1,
      goal,
      startDate: args.startDate,
      endDate: args.endDate,
      status: args.status ?? 'planned',
      createdBy: ctx.session.userId,
      createdAt: Date.now(),
    })
  },
})

export const listByTrack = privateQuery({
  args: {
    trackId: vv.id('tracks'),
    status: v.optional(vv.doc('sprints').fields.status),
  },
  handler: async (ctx, args) => {
    const sprints = args.status
      ? await ctx.db
          .query('sprints')
          .withIndex('by_track_status', (q) =>
            q.eq('trackId', args.trackId).eq('status', args.status!),
          )
          .collect()
      : await ctx.db
          .query('sprints')
          .withIndex('by_track', (q) => q.eq('trackId', args.trackId))
          .collect()

    return await Promise.all(
      sprints.map(async (sprint) => {
        const tasks = await ctx.db
          .query('tasks')
          .withIndex('by_sprint', (q) => q.eq('sprintId', sprint._id))
          .collect()
        return {
          ...sprint,
          stats: {
            totalTasks: tasks.length,
            totalCompletedTasks: tasks.filter((t) => t.status === 'done')
              .length,
          },
        }
      }),
    )
  },
})

export const addTask = privateMutation({
  args: {
    taskId: vv.id('tasks'),
    sprintId: vv.id('sprints'),
  },

  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),

  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId)

    if (!task) {
      throw new Error('Task not found')
    }

    const sprint = await ctx.db.get(args.sprintId)

    if (!sprint) {
      throw new Error('Sprint not found')
    }
    if (task.trackId !== sprint.trackId) {
      throw new Error('Task and sprint must belong to the same track')
    }

    await ctx.db.patch(args.taskId, {
      sprintId: args.sprintId,
      updatedAt: Date.now(),
    })

    return {
      success: true,
      message: 'Task added to sprint',
    }
  },
})

export const listTasksBySprint = privateQuery({
  args: {
    sprintId: vv.id('sprints'),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const sprint = await ctx.db.get(args.sprintId)
    if (!sprint) {
      throw new Error('Sprint not found')
    }

    return await ctx.db
      .query('tasks')
      .withIndex('by_sprint', (q) => q.eq('sprintId', args.sprintId))
      .collect()
  },
})

export const edit = privateMutation({
  args: {
    sprintId: vv.id('sprints'),
    goal: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    status: vv.doc('sprints').fields.status,
  },
  handler: async (ctx, args) => {
    const sprint = await ctx.db.get(args.sprintId)
    if (!sprint) throw new Error('Sprint not found')

    const goal = args.goal.trim()

    if (!goal) throw new Error('Goal cannot be empty')

    if (goal.length > 160) {
      throw new Error('Goal must be 160 characters or fewer')
    }

    if (args.endDate <= args.startDate) {
      throw new Error('End date must be after the start date')
    }

    await ctx.db.patch(args.sprintId, {
      goal,
      startDate: args.startDate,
      endDate: args.endDate,
      status: args.status,
      updatedAt: Date.now(),
    })

    return null
  },
})

export const remove = privateMutation({
  args: {
    sprintId: vv.id('sprints'),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const sprint = await ctx.db.get(args.sprintId)
    if (!sprint) throw new Error('Sprint not found')

    await ctx.db.delete(args.sprintId)
    return null
  },
})

export const backlog = privateQuery({
  args: {
    trackId: vv.id('tracks'),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query('tasks')
      .withIndex('by_track', (q) => q.eq('trackId', args.trackId))
      .collect()

    return tasks.filter((task) => task.sprintId === undefined)
  },
})

export const progress = privateQuery({
  args: {
    sprintId: vv.id('sprints'),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const sprint = await ctx.db.get(args.sprintId)
    if (!sprint) throw new Error('Sprint not found')

    const tasks = await ctx.db
      .query('tasks')
      .withIndex('by_sprint', (q) => q.eq('sprintId', args.sprintId))
      .collect()

    const total = tasks.length
    const done = tasks.filter((t) => t.status === 'done').length
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length
    const todo = tasks.filter((t) => t.status === 'todo').length
    const backlog = tasks.filter((t) => t.status === 'backlog').length

    return {
      sprintId: args.sprintId,
      trackId: sprint.trackId,
      total,
      done,
      inProgress,
      todo,
      backlog,
      progress: total === 0 ? 0 : (done / total) * 100,
    }
  },
})

export const burndownChart = privateQuery({
  args: {
    sprintId: vv.id('sprints'),
  },
  handler: async (ctx, args) => {
    const sprint = await ctx.db.get(args.sprintId)

    if (!sprint) {
      throw new Error('Sprint not found')
    }

    const tasks = await ctx.db
      .query('tasks')
      .withIndex('by_sprint', (q) => q.eq('sprintId', args.sprintId))
      .collect()

    const totalTasks = tasks.length

    const doneTasks = tasks.filter((t) => t.status === 'done').length

    const start = sprint.startDate
    const end = sprint.endDate

    const dayMs = 24 * 60 * 60 * 1000
    const totalDays = Math.max(1, Math.ceil((end - start) / dayMs))

    const result: {
      date: number
      ideal: number
      remaining: number
    }[] = []

    for (let i = 0; i <= totalDays; i++) {
      const date = start + i * dayMs

      const idealRemaining = totalTasks - (totalTasks * i) / totalDays

      const actualRemaining = totalTasks - doneTasks

      result.push({
        date,
        ideal: Math.max(idealRemaining, 0),
        remaining: Math.max(actualRemaining, 0),
      })
    }

    return {
      sprintId: args.sprintId,
      totalTasks,
      doneTasks,
      burndown: result,
    }
  },
})
