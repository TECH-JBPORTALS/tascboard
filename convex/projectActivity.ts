import { v } from 'convex/values'
import { components } from './_generated/api'
import { organizationQuery } from './helpers/customFunctions'
import { vv } from './schema'

export const list = organizationQuery({
  args: {
    projectId: vv.id('projects'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 50, 100)

    const activities = await ctx.db
      .query('projectActivities')
      .withIndex('by_project', (q) => q.eq('projectId', args.projectId))
      .order('desc')
      .take(limit)

    return activities
  },
})

export const topPerformers = organizationQuery({
  args: {
    projectId: vv.id('projects'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 5, 10)

    const tasks = await ctx.db
      .query('tasks')
      .withIndex('by_project', (q) => q.eq('projectId', args.projectId))
      .collect()

    if (tasks.length === 0) {
      return []
    }

    const pointsByEmployee = new Map<string, number>()

    for (const task of tasks) {
      const rows = await ctx.db
        .query('employeePerformancePoints')
        .withIndex('by_task', (q) => q.eq('taskId', task._id))
        .collect()

      for (const row of rows) {
        const key = row.employeeId as string
        pointsByEmployee.set(key, (pointsByEmployee.get(key) ?? 0) + row.points)
      }
    }

    if (pointsByEmployee.size === 0) {
      const completedByAssignee = new Map<string, number>()
      for (const task of tasks) {
        if (task.status !== 'done') {
          continue
        }
        // completedByAssignee.set(
        //   task.assignedTo,
        //   (completedByAssignee.get(task.assignedTo) ?? 0) + 1,
        // );
      }

      return [...completedByAssignee.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([employeeId, points]) => ({
          employeeId,
          displayName: employeeId,
          points,
        }))
    }

    const ranked = [...pointsByEmployee.entries()].sort((a, b) => b[1] - a[1])

    const results: Array<{
      employeeId: string
      displayName: string
      points: number
    }> = []

    for (const [employeeId, points] of ranked.slice(0, limit)) {
      let displayName = employeeId

      const employee = await ctx.runQuery(
        components.betterAuth.adapter.findOne,
        {
          model: 'employee',
          where: [{ field: '_id', operator: 'eq', value: employeeId }],
        },
      )

      if (employee && typeof employee === 'object' && 'userId' in employee) {
        const user = await ctx.runQuery(components.betterAuth.adapter.findOne, {
          model: 'user',
          where: [
            {
              field: '_id',
              operator: 'eq',
              value: (employee as { userId: string }).userId,
            },
          ],
        })
        if (user && typeof user === 'object' && 'name' in user) {
          const name = (user as { name?: string }).name?.trim()
          if (name) {
            displayName = name
          }
        }
      }
      results.push({ employeeId, displayName, points })
    }

    return results
  },
})
