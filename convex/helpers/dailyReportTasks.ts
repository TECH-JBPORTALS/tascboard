import type { Doc, Id } from '../_generated/dataModel'
import type { QueryCtx } from '../_generated/server'

export function getTaskCompletionTimestamp(
  task: Doc<'tasks'>,
): number | undefined {
  return task.completedAt ?? task.updatedAt
}

export function isTaskDoneToday(
  task: Doc<'tasks'>,
  dayStart: number,
  dayEnd: number,
): boolean {
  if (task.status !== 'done') return false

  const completionTime = getTaskCompletionTimestamp(task)
  if (completionTime === undefined) return false

  return completionTime >= dayStart && completionTime <= dayEnd
}

export async function getEmployeeAssignedTaskIds(
  ctx: QueryCtx,
  employee: { _id: string; userId: string },
): Promise<Set<Id<'tasks'>>> {
  const assigneeIds = [...new Set([employee._id, employee.userId])]
  const taskIds = new Set<Id<'tasks'>>()

  for (const employeeId of assigneeIds) {
    const memberships = await ctx.db
      .query('taskMember')
      .withIndex('by_employee', (q) => q.eq('employeeId', employeeId))
      .collect()

    for (const membership of memberships) {
      taskIds.add(membership.taskId)
    }
  }

  return taskIds
}

export async function listEmployeeDoneTasksForDay(
  ctx: QueryCtx,
  employee: { _id: string; userId: string },
  dayStart: number,
  dayEnd: number,
): Promise<Doc<'tasks'>[]> {
  const taskIds = await getEmployeeAssignedTaskIds(ctx, employee)

  const tasks = await Promise.all(
    [...taskIds].map((taskId) => ctx.db.get(taskId)),
  )

  return tasks.filter(
    (task): task is Doc<'tasks'> =>
      task !== null && isTaskDoneToday(task, dayStart, dayEnd),
  )
}

export async function isTaskEligibleForDailyReport(
  ctx: QueryCtx,
  employee: { _id: string; userId: string },
  taskId: Id<'tasks'>,
  dayStart: number,
  dayEnd: number,
): Promise<boolean> {
  const task = await ctx.db.get(taskId)
  if (!task || !isTaskDoneToday(task, dayStart, dayEnd)) {
    return false
  }

  const assignedTaskIds = await getEmployeeAssignedTaskIds(ctx, employee)
  return assignedTaskIds.has(taskId)
}

export function statusTimingPatch(
  oldStatus: Doc<'tasks'>['status'],
  newStatus: Doc<'tasks'>['status'],
  now: number,
): Partial<Pick<Doc<'tasks'>, 'completedAt'>> {
  if (newStatus === 'done' && oldStatus !== 'done') {
    return { completedAt: now }
  }

  if (oldStatus === 'done' && newStatus !== 'done') {
    return { completedAt: undefined }
  }

  return {}
}
