import { v } from 'convex/values'
import { privateQuery } from './lib/customFunctions'
import { vv } from './schema'

export const listByTask = privateQuery({
  args: {
    taskId: vv.id('tasks'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { taskId, limit }) => {
    const take = Math.min(limit ?? 50, 100)
    const activities = await ctx.db
      .query('taskActivities')
      .withIndex('by_task', (q) => q.eq('taskId', taskId))
      .order('desc')
      .take(take)

    return activities
  },
})
