import { addDays, endOfWeek, format, isSameDay, startOfDay } from 'date-fns'

export const NO_DUE_DATE_VALUE = '__no_due_date__'
export const CUSTOM_DUE_DATE_VALUE = '__custom_due_date__'

export type DueDatePreset = {
  id: string
  label: string
  getDate: () => Date
  shortcut?: string
}

export function buildDueDatePresets(): DueDatePreset[] {
  const today = startOfDay(new Date())

  return [
    {
      id: 'tomorrow',
      label: 'Tomorrow',
      shortcut: '1',
      getDate: () => addDays(today, 1),
    },
    {
      id: 'end-of-week',
      label: 'End of this week',
      shortcut: '2',
      getDate: () => endOfWeek(today, { weekStartsOn: 1 }),
    },
    {
      id: 'one-week',
      label: 'In one week',
      shortcut: '3',
      getDate: () => addDays(today, 7),
    },
  ]
}

export function getDueDateRadioValue(
  dueDate: number | null | undefined,
  presets: DueDatePreset[] = buildDueDatePresets(),
): string {
  if (dueDate == null) return NO_DUE_DATE_VALUE

  const date = startOfDay(new Date(dueDate))
  const matched = presets.find((preset) =>
    isSameDay(startOfDay(preset.getDate()), date),
  )

  return matched?.id ?? CUSTOM_DUE_DATE_VALUE
}

export function formatDueDatePresetSubtitle(preset: DueDatePreset): string {
  return format(preset.getDate(), 'EEE, d MMM')
}
