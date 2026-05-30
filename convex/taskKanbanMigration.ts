import type { Doc } from './_generated/dataModel'
import { internalMutation } from './_generated/server'
import { compareTaskStatusOrder } from './lib/taskKanban'

/** One-time backfill for tasks missing statusOrder. Safe to run multiple times. */
export const backfillTaskStatusOrder = internalMutation({
  args: {},
  handler: async (ctx) => {
    const tasks = await ctx.db.query('tasks').collect()

    const byTrackStatus = new Map<string, Doc<'tasks'>[]>()

    for (const task of tasks) {
      if (task.statusOrder !== undefined) continue
      const key = `${task.trackId}:${task.status}`
      const group = byTrackStatus.get(key) ?? []
      group.push(task)
      byTrackStatus.set(key, group)
    }

    for (const group of byTrackStatus.values()) {
      const sorted = group.toSorted(compareTaskStatusOrder)
      await Promise.all(
        sorted.map((task, index) =>
          ctx.db.patch(task._id, { statusOrder: index }),
        ),
      )
    }

    return null
  },
})
