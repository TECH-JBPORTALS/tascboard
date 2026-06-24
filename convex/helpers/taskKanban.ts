import type { Doc, Id } from '../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../_generated/server'

type TaskStatus = Doc<'tasks'>['status']

export function compareTaskStatusOrder(
  a: Pick<Doc<'tasks'>, 'statusOrder' | 'createdAt'>,
  b: Pick<Doc<'tasks'>, 'statusOrder' | 'createdAt'>,
) {
  const aOrder = a.statusOrder ?? a.createdAt
  const bOrder = b.statusOrder ?? b.createdAt
  return aOrder - bOrder
}

export async function getTasksInStatus(
  ctx: QueryCtx | MutationCtx,
  trackId: Id<'tracks'>,
  status: TaskStatus,
) {
  const tasks = await ctx.db
    .query('tasks')
    .withIndex('by_track_status_order', (q) =>
      q.eq('trackId', trackId).eq('status', status),
    )
    .collect()

  return tasks.toSorted(compareTaskStatusOrder)
}

export async function getNextStatusOrder(
  ctx: QueryCtx | MutationCtx,
  trackId: Id<'tracks'>,
  status: TaskStatus,
) {
  const tasks = await getTasksInStatus(ctx, trackId, status)
  if (tasks.length === 0) return 0
  const last = tasks[tasks.length - 1]
  return (last.statusOrder ?? last.createdAt) + 1
}

export async function reindexStatusColumn(
  ctx: MutationCtx,
  trackId: Id<'tracks'>,
  status: TaskStatus,
  excludeTaskId?: Id<'tasks'>,
) {
  const tasks = (await getTasksInStatus(ctx, trackId, status)).filter(
    (task) => task._id !== excludeTaskId,
  )

  await Promise.all(
    tasks.map((task, index) =>
      ctx.db.patch(task._id, {
        statusOrder: index,
        updatedAt: Date.now(),
      }),
    ),
  )
}
