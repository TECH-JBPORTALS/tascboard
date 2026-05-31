import { Infer } from 'convex/values'
import type { MutationCtx } from '../_generated/server'
import { vv } from '../schema'

const taskActivityInputValidator = vv
  .doc('taskActivities')
  .omit('_id', '_creationTime', 'createdAt')

type TaskActivityInput = Infer<typeof taskActivityInputValidator>

function getStartOfToday() {
  const now = new Date()

  now.setHours(0, 0, 0, 0)

  return now.getTime()
}

export async function logTaskActivity(
  ctx: MutationCtx,
  args: TaskActivityInput,
) {
  const startOfToday = getStartOfToday()

  const existingActivities = await ctx.db
    .query('taskActivities')
    .withIndex('by_task', (q) => q.eq('taskId', args.taskId))
    .collect()

  const duplicateActivity = existingActivities.find(
    (activity) =>
      activity.actorUserId === args.actorUserId &&
      activity.kind === args.kind &&
      activity.fromValue === args.fromValue &&
      activity.toValue === args.toValue &&
      (activity.createdAt ?? 0) >= startOfToday,
  )

  if (duplicateActivity) {
    return
  }

  await ctx.db.insert('taskActivities', {
    taskId: args.taskId,
    actorName: args.actorName,
    kind: args.kind,
    fromValue: args.fromValue,
    toValue: args.toValue,
    meta: args.meta,
    actorUserId: args.actorUserId,
    createdAt: Date.now(),
  })
}

export function formatTaskDate(timestamp: number) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(timestamp))
}
