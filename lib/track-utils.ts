import type { RemixiconComponentType } from '@remixicon/react'
import {
  RiCalendarLine,
  RiCheckboxCircleFill,
  RiCheckFill,
  RiRoundedCorner,
  RiRunLine,
} from '@remixicon/react'
import type { Doc } from '@/convex/_generated/dataModel'

export const SPRINT_GOAL_MAX_LENGTH = 160

export type TrackStatus = Doc<'tracks'>['status']
export type SprintStatus = Doc<'sprints'>['status']

export const trackStatusLabels: Record<TrackStatus, string> = {
  active: 'Active',
  completed: 'Completed',
  archived: 'Archived',
}

export const sprintStatusLabels: Record<SprintStatus, string> = {
  planned: 'Planned',
  active: 'Active',
  completed: 'Completed',
}

export const sprintStatusOrder: SprintStatus[] = [
  'planned',
  'active',
  'completed',
]

type SprintStatusConfig = {
  label: string
  icon: RemixiconComponentType
  iconClassName: string
  shortcut: string
}

export const sprintStatusConfig: Record<SprintStatus, SprintStatusConfig> = {
  planned: {
    label: sprintStatusLabels.planned,
    icon: RiCheckFill,
    iconClassName: 'text-muted-foreground',
    shortcut: '1',
  },
  active: {
    label: sprintStatusLabels.active,
    icon: RiRunLine,
    iconClassName: 'text-primary',
    shortcut: '2',
  },
  completed: {
    label: sprintStatusLabels.completed,
    icon: RiCheckboxCircleFill,
    iconClassName: 'text-blue-500',
    shortcut: '3',
  },
}

export function formatSprintLabel(sprintNumber: number) {
  return `Sprint ${sprintNumber}`
}

export function initialsFromId(id: string) {
  const cleaned = id.replace(/[^a-zA-Z0-9]/g, '')
  if (cleaned.length >= 2) {
    return cleaned.slice(0, 2).toUpperCase()
  }
  return id.slice(0, 2).toUpperCase()
}

export function nextTrackCode(existingCodes: string[]) {
  const numbers = existingCodes
    .map((code) => {
      const match = code.match(/(\d+)$/)
      return match ? Number.parseInt(match[1]!, 10) : 0
    })
    .filter((n) => !Number.isNaN(n))

  const next = numbers.length > 0 ? Math.max(...numbers) + 1 : 1
  return `TRK-${String(next).padStart(3, '0')}`
}
