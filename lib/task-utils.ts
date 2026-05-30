import type { RemixiconComponentType } from '@remixicon/react'
import {
  RiAlarmWarningLine,
  RiArrowDownSLine,
  RiArrowUpSLine,
  RiBarChartFill,
  RiCheckboxBlankCircleLine,
  RiCheckboxCircleFill,
  RiMoreLine,
  RiRecordCircleLine,
} from '@remixicon/react'
import type { Doc } from '@/convex/_generated/dataModel'

export type TaskStatus = Doc<'tasks'>['status']
export type TaskPriority = Doc<'tasks'>['priority']

export const taskStatusLabels: Record<TaskStatus, string> = {
  backlog: 'Backlog',
  todo: 'Todo',
  in_progress: 'In progress',
  done: 'Done',
}

/** Display order for status-grouped issue lists. */
export const taskStatusOrder: TaskStatus[] = [
  'backlog',
  'todo',
  'in_progress',
  'done',
]

export const taskPriorityLabels: Record<TaskPriority, string> = {
  critical: 'Urgent',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

export const taskPriorityOrder: TaskPriority[] = [
  'critical',
  'high',
  'medium',
  'low',
]

type StatusConfig = {
  label: string
  icon: RemixiconComponentType
  iconClassName: string
  shortcut: string
}

export const taskStatusConfig: Record<TaskStatus, StatusConfig> = {
  backlog: {
    label: taskStatusLabels.backlog,
    icon: RiMoreLine,
    iconClassName: 'text-muted-foreground',
    shortcut: '1',
  },
  todo: {
    label: taskStatusLabels.todo,
    icon: RiCheckboxBlankCircleLine,
    iconClassName: 'text-muted-foreground',
    shortcut: '2',
  },
  in_progress: {
    label: taskStatusLabels.in_progress,
    icon: RiRecordCircleLine,
    iconClassName: 'text-amber-500',
    shortcut: '3',
  },
  done: {
    label: taskStatusLabels.done,
    icon: RiCheckboxCircleFill,
    iconClassName: 'text-blue-500',
    shortcut: '4',
  },
}

type PriorityConfig = {
  label: string
  icon: RemixiconComponentType
  iconClassName: string
  shortcut: string
}

export const taskPriorityConfig: Record<TaskPriority, PriorityConfig> = {
  critical: {
    label: taskPriorityLabels.critical,
    icon: RiAlarmWarningLine,
    iconClassName: 'text-orange-500',
    shortcut: '1',
  },
  high: {
    label: taskPriorityLabels.high,
    icon: RiBarChartFill,
    iconClassName: 'text-muted-foreground',
    shortcut: '2',
  },
  medium: {
    label: taskPriorityLabels.medium,
    icon: RiBarChartFill,
    iconClassName: 'text-muted-foreground opacity-70',
    shortcut: '3',
  },
  low: {
    label: taskPriorityLabels.low,
    icon: RiBarChartFill,
    iconClassName: 'text-muted-foreground opacity-50',
    shortcut: '4',
  },
}

export function sortTasksByStatusOrder<
  T extends Pick<Doc<'tasks'>, 'statusOrder' | 'createdAt'>,
>(tasks: T[]) {
  return tasks.toSorted((a, b) => {
    const aOrder = a.statusOrder ?? a.createdAt
    const bOrder = b.statusOrder ?? b.createdAt
    return aOrder - bOrder
  })
}

export function groupTasksByStatus(tasks: Doc<'tasks'>[]) {
  const groups = Object.fromEntries(
    taskStatusOrder.map((status) => [status, [] as Doc<'tasks'>[]]),
  ) as Record<TaskStatus, Doc<'tasks'>[]>

  for (const task of tasks) {
    groups[task.status].push(task)
  }

  for (const status of taskStatusOrder) {
    groups[status] = sortTasksByStatusOrder(groups[status])
  }

  return groups
}
