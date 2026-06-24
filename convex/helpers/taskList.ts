import type { Doc, Id } from '../_generated/dataModel'
import type { QueryCtx } from '../_generated/server'
import { compareTaskStatusOrder } from './taskKanban'

export type TaskListFilterInput = {
  trackId: Id<'tracks'>
  sprintId?: Id<'sprints'>
  statuses?: Doc<'tasks'>['status'][]
  priority?: Doc<'tasks'>['priority']
  assigneeIds?: string[]
  labelIds?: Id<'labels'>[]
  noDueDate?: boolean
  dueFrom?: number
  dueTo?: number
}

function hasDueFilter(filters: TaskListFilterInput): boolean {
  return (
    filters.noDueDate === true ||
    filters.dueFrom !== undefined ||
    filters.dueTo !== undefined
  )
}

function hasRelationalFilters(filters: TaskListFilterInput): boolean {
  return (
    (filters.assigneeIds?.length ?? 0) > 0 ||
    (filters.labelIds?.length ?? 0) > 0
  )
}

async function loadTrackTasks(
  ctx: QueryCtx,
  filters: TaskListFilterInput,
): Promise<Doc<'tasks'>[]> {
  const { trackId, sprintId, statuses, priority } = filters
  const statusList = statuses ?? []

  if (
    sprintId !== undefined &&
    statusList.length === 0 &&
    priority === undefined &&
    !hasRelationalFilters(filters) &&
    !hasDueFilter(filters)
  ) {
    return await ctx.db
      .query('tasks')
      .withIndex('by_track_sprint', (q) =>
        q.eq('trackId', trackId).eq('sprintId', sprintId),
      )
      .collect()
  }

  if (
    statusList.length === 1 &&
    sprintId === undefined &&
    priority === undefined &&
    !hasRelationalFilters(filters) &&
    !hasDueFilter(filters)
  ) {
    return await ctx.db
      .query('tasks')
      .withIndex('by_track_status', (q) =>
        q.eq('trackId', trackId).eq('status', statusList[0]!),
      )
      .collect()
  }

  if (
    priority !== undefined &&
    sprintId === undefined &&
    statusList.length === 0 &&
    !hasRelationalFilters(filters) &&
    !hasDueFilter(filters)
  ) {
    return await ctx.db
      .query('tasks')
      .withIndex('by_track_priority', (q) =>
        q.eq('trackId', trackId).eq('priority', priority),
      )
      .collect()
  }

  return await ctx.db
    .query('tasks')
    .withIndex('by_track', (q) => q.eq('trackId', trackId))
    .collect()
}

function applyInMemoryFilters(
  tasks: Doc<'tasks'>[],
  filters: TaskListFilterInput,
): Doc<'tasks'>[] {
  let result = tasks

  if (filters.priority !== undefined) {
    result = result.filter((t) => t.priority === filters.priority)
  }

  if (filters.sprintId !== undefined) {
    result = result.filter((t) => t.sprintId === filters.sprintId)
  }

  if (filters.statuses !== undefined && filters.statuses.length > 0) {
    const statusSet = new Set(filters.statuses)
    result = result.filter((t) => statusSet.has(t.status))
  }

  if (filters.noDueDate) {
    result = result.filter((t) => t.dueDate == null)
  } else {
    if (filters.dueFrom !== undefined) {
      const dueFrom = filters.dueFrom
      result = result.filter((t) => t.dueDate != null && t.dueDate >= dueFrom)
    }
    if (filters.dueTo !== undefined) {
      const dueTo = filters.dueTo
      result = result.filter((t) => t.dueDate != null && t.dueDate <= dueTo)
    }
  }

  return result
}

/** OR match: task has any of the given assignees. */
async function taskIdsMatchingAssignees(
  ctx: QueryCtx,
  trackTaskIds: Set<Id<'tasks'>>,
  assigneeIds: string[],
): Promise<Set<Id<'tasks'>>> {
  const matching = new Set<Id<'tasks'>>()
  if (assigneeIds.length === 0) return matching

  const assigneeSet = new Set(assigneeIds)

  if (assigneeIds.length <= trackTaskIds.size) {
    for (const employeeId of assigneeIds) {
      const links = await ctx.db
        .query('taskMember')
        .withIndex('by_employee', (q) => q.eq('employeeId', employeeId))
        .collect()
      for (const link of links) {
        if (trackTaskIds.has(link.taskId)) {
          matching.add(link.taskId)
        }
      }
    }
    return matching
  }

  for (const taskId of trackTaskIds) {
    const members = await ctx.db
      .query('taskMember')
      .withIndex('by_task', (q) => q.eq('taskId', taskId))
      .collect()
    if (members.some((m) => assigneeSet.has(m.employeeId))) {
      matching.add(taskId)
    }
  }

  return matching
}

/** OR match: task has any of the given labels. */
async function taskIdsMatchingLabels(
  ctx: QueryCtx,
  trackTaskIds: Set<Id<'tasks'>>,
  labelIds: Id<'labels'>[],
): Promise<Set<Id<'tasks'>>> {
  const matching = new Set<Id<'tasks'>>()
  if (labelIds.length === 0) return matching

  const labelSet = new Set(labelIds)

  if (labelIds.length <= trackTaskIds.size) {
    for (const labelId of labelIds) {
      const links = await ctx.db
        .query('taskLabels')
        .withIndex('by_label', (q) => q.eq('labelId', labelId))
        .collect()
      for (const link of links) {
        if (trackTaskIds.has(link.taskId)) {
          matching.add(link.taskId)
        }
      }
    }
    return matching
  }

  for (const taskId of trackTaskIds) {
    const links = await ctx.db
      .query('taskLabels')
      .withIndex('by_task', (q) => q.eq('taskId', taskId))
      .collect()
    if (links.some((l) => labelSet.has(l.labelId))) {
      matching.add(taskId)
    }
  }

  return matching
}

export async function listTasksForTrack(
  ctx: QueryCtx,
  filters: TaskListFilterInput,
): Promise<Doc<'tasks'>[]> {
  let tasks = await loadTrackTasks(ctx, filters)
  tasks = applyInMemoryFilters(tasks, filters)

  const assigneeIds = filters.assigneeIds
  const labelIds = filters.labelIds
  const needsAssignee = (assigneeIds?.length ?? 0) > 0
  const needsLabel = (labelIds?.length ?? 0) > 0

  if (!needsAssignee && !needsLabel) {
    return tasks.toSorted(compareTaskStatusOrder)
  }

  const trackTaskIds = new Set(tasks.map((t) => t._id))

  const [assigneeMatch, labelMatch] = await Promise.all([
    needsAssignee
      ? taskIdsMatchingAssignees(ctx, trackTaskIds, assigneeIds!)
      : null,
    needsLabel ? taskIdsMatchingLabels(ctx, trackTaskIds, labelIds!) : null,
  ])

  if (assigneeMatch) {
    tasks = tasks.filter((t) => assigneeMatch.has(t._id))
  }

  if (labelMatch) {
    tasks = tasks.filter((t) => labelMatch.has(t._id))
  }

  return tasks.toSorted(compareTaskStatusOrder)
}
