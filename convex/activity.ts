import { v } from 'convex/values'
import { requireIdentity } from './lib/auth'
import { privateQuery } from './lib/customFunctions'

export const listByTask = privateQuery({
  args: {
    taskId: v.id('tasks'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { taskId, limit }) => {
    await requireIdentity(ctx)

    const take = Math.min(limit ?? 50, 100)
    const activities = await ctx.db
      .query('taskActivities')
      .withIndex('by_task', (q) => q.eq('taskId', taskId))
      .order('desc')
      .take(take)

    return activities
  },
})
