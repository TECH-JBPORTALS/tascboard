import { endOfDay, endOfWeek, startOfDay, startOfWeek } from 'date-fns'
import { createParser, parseAsInteger, parseAsString } from 'nuqs'
import type { Id } from '@/convex/_generated/dataModel'
import {
  type TaskStatus,
  taskStatusLabels,
  taskStatusOrder,
} from '@/lib/task-utils'

export type TrackTaskView = 'status' | 'sprints' | 'kanban'

export type TrackTaskFilterType =
  | 'assignee'
  | 'label'
  | 'status'
  | 'sprint'
  | 'due'

export type DueDatePreset = 'overdue' | 'today' | 'week' | 'none' | 'custom'

export const dueDatePresetLabels: Record<DueDatePreset, string> = {
  overdue: 'Overdue',
  today: 'Due today',
  week: 'Due this week',
  none: 'No due date',
  custom: 'Custom range',
}

export const dueDatePresetOrder: DueDatePreset[] = [
  'overdue',
  'today',
  'week',
  'none',
  'custom',
]

export type TrackTaskFilterUrlState = {
  assigneeIds: string[]
  labelIds: Id<'labels'>[]
  statuses: TaskStatus[]
  sprintId: Id<'sprints'> | null
  duePreset: DueDatePreset | null
  dueFrom: number | null
  dueTo: number | null
}

export type TaskListFilterArgs = {
  trackId: Id<'tracks'>
  sprintId?: Id<'sprints'>
  assigneeIds?: string[]
  labelIds?: Id<'labels'>[]
  statuses?: TaskStatus[]
  noDueDate?: boolean
  dueFrom?: number
  dueTo?: number
}

const parseCommaSeparated = createParser({
  parse: (value) => {
    const parts = value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    return parts.length > 0 ? parts : null
  },
  serialize: (value) => value.join(','),
  eq: (a, b) =>
    a.length === b.length && a.every((item, index) => item === b[index]),
})

export const parseAsAssigneeIds = parseCommaSeparated.withDefault([])

export const parseAsLabelIds = createParser({
  parse: (value) => {
    const parts = value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    return parts.length > 0 ? (parts as Id<'labels'>[]) : null
  },
  serialize: (value) => value.join(','),
  eq: (a, b) =>
    a.length === b.length && a.every((item, index) => item === b[index]),
}).withDefault([] as Id<'labels'>[])

export const parseAsTaskStatuses = createParser({
  parse: (value) => {
    const parts = value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    const valid = parts.filter((s): s is TaskStatus =>
      (taskStatusOrder as readonly string[]).includes(s),
    )
    return valid.length > 0 ? valid : null
  },
  serialize: (value) => value.join(','),
  eq: (a, b) =>
    a.length === b.length && a.every((item, index) => item === b[index]),
}).withDefault([] as TaskStatus[])

export const parseAsSprintId = parseAsString

export const parseAsDuePreset = createParser({
  parse: (value) => {
    if ((dueDatePresetOrder as readonly string[]).includes(value)) {
      return value as DueDatePreset
    }
    return null
  },
  serialize: (value) => value,
})

export const parseAsDueFrom = parseAsInteger
export const parseAsDueTo = parseAsInteger

export const trackTaskFilterParsers = {
  assignee: parseAsAssigneeIds,
  label: parseAsLabelIds,
  status: parseAsTaskStatuses,
  sprint: parseAsSprintId,
  due: parseAsDuePreset,
  dueFrom: parseAsDueFrom,
  dueTo: parseAsDueTo,
}

export function getTrackTaskView(pathname: string): TrackTaskView {
  if (pathname.endsWith('/kanban')) return 'kanban'
  if (pathname.endsWith('/sprints')) return 'sprints'
  return 'status'
}

export function getAvailableFilterTypes(
  view: TrackTaskView,
): TrackTaskFilterType[] {
  const all: TrackTaskFilterType[] = [
    'assignee',
    'due',
    'label',
    'sprint',
    'status',
  ]
  if (view === 'sprints') {
    return all.filter((t) => t !== 'sprint')
  }
  if (view === 'status' || view === 'kanban') {
    return all.filter((t) => t !== 'status')
  }
  return all
}

export function duePresetToBounds(
  preset: DueDatePreset,
  customFrom: number | null,
  customTo: number | null,
  now = new Date(),
): Pick<TaskListFilterArgs, 'dueFrom' | 'dueTo' | 'noDueDate'> {
  const todayStart = startOfDay(now).getTime()
  const todayEnd = endOfDay(now).getTime()

  switch (preset) {
    case 'overdue':
      return { dueTo: todayStart - 1 }
    case 'today':
      return { dueFrom: todayStart, dueTo: todayEnd }
    case 'week':
      return {
        dueFrom: startOfWeek(now, { weekStartsOn: 1 }).getTime(),
        dueTo: endOfWeek(now, { weekStartsOn: 1 }).getTime(),
      }
    case 'none':
      return { noDueDate: true }
    case 'custom': {
      const args: Pick<TaskListFilterArgs, 'dueFrom' | 'dueTo' | 'noDueDate'> =
        {}
      if (customFrom !== null) args.dueFrom = customFrom
      if (customTo !== null) args.dueTo = customTo
      return args
    }
    default:
      return {}
  }
}

export function buildTaskListArgs(
  trackId: Id<'tracks'>,
  state: TrackTaskFilterUrlState,
  options?: { sprintId?: Id<'sprints'>; view?: TrackTaskView },
): TaskListFilterArgs {
  const args: TaskListFilterArgs = { trackId }

  const sprintId =
    options?.sprintId ??
    (options?.view !== 'sprints' && state.sprintId ? state.sprintId : undefined)
  if (sprintId) args.sprintId = sprintId

  if (state.assigneeIds.length > 0) {
    args.assigneeIds = state.assigneeIds
  }
  if (state.labelIds.length > 0) {
    args.labelIds = state.labelIds
  }
  if (state.statuses.length > 0) {
    args.statuses = state.statuses
  }

  if (state.duePreset) {
    Object.assign(
      args,
      duePresetToBounds(state.duePreset, state.dueFrom, state.dueTo),
    )
  }

  return args
}

export type ActiveTrackTaskFilter = {
  id: string
  type: TrackTaskFilterType
  value: string
  label: string
}

export function buildActiveFilters(
  state: TrackTaskFilterUrlState,
  labels: {
    assigneeNames?: Record<string, string>
    labelNames?: Record<string, string>
    sprintNames?: Record<string, string>
  },
): ActiveTrackTaskFilter[] {
  const active: ActiveTrackTaskFilter[] = []

  for (const id of state.assigneeIds) {
    active.push({
      id: `assignee:${id}`,
      type: 'assignee',
      value: id,
      label: labels.assigneeNames?.[id] ?? id,
    })
  }

  for (const id of state.labelIds) {
    active.push({
      id: `label:${id}`,
      type: 'label',
      value: id,
      label: labels.labelNames?.[id] ?? 'Label',
    })
  }

  for (const status of state.statuses) {
    active.push({
      id: `status:${status}`,
      type: 'status',
      value: status,
      label: taskStatusLabels[status],
    })
  }

  if (state.sprintId) {
    active.push({
      id: `sprint:${state.sprintId}`,
      type: 'sprint',
      value: state.sprintId,
      label: labels.sprintNames?.[state.sprintId] ?? 'Sprint',
    })
  }

  if (state.duePreset) {
    let dueLabel = dueDatePresetLabels[state.duePreset]
    if (state.duePreset === 'custom') {
      const parts: string[] = []
      if (state.dueFrom !== null) {
        parts.push(
          `from ${new Date(state.dueFrom).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`,
        )
      }
      if (state.dueTo !== null) {
        parts.push(
          `to ${new Date(state.dueTo).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`,
        )
      }
      if (parts.length > 0) dueLabel = parts.join(' ')
    }
    active.push({
      id: `due:${state.duePreset}`,
      type: 'due',
      value: state.duePreset,
      label: dueLabel,
    })
  }

  return active
}

export function hasActiveFilters(state: TrackTaskFilterUrlState): boolean {
  return (
    state.assigneeIds.length > 0 ||
    state.labelIds.length > 0 ||
    state.statuses.length > 0 ||
    state.sprintId !== null ||
    state.duePreset !== null
  )
}
