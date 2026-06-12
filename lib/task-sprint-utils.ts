import type { Id } from '@/convex/_generated/dataModel'

export const NO_SPRINT_VALUE = '__no_sprint__'

export type SprintPickerValue = Id<'sprints'> | null

export function toSprintPickerValue(
  sprintId: SprintPickerValue | undefined,
): string {
  return sprintId ?? NO_SPRINT_VALUE
}

export function fromSprintPickerValue(selected: string): SprintPickerValue {
  return selected === NO_SPRINT_VALUE ? null : (selected as Id<'sprints'>)
}
