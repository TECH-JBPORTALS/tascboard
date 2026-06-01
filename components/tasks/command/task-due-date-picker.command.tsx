'use client'

import { RiCalendarCloseLine, RiCalendarLine } from '@remixicon/react'
import { format } from 'date-fns'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@/components/ui/command'
import {
  buildDueDatePresets,
  type DueDatePreset,
} from '@/lib/task-due-date-presets'
import { useOptionalTaskActionsContext } from '../task-actions-provider'

type TaskDueDatePickerCommandProps = {
  dueDate?: number | null
  hasDueDate?: boolean
  presets?: DueDatePreset[]
  onSelectDate?: (date: Date) => void
  onClear?: () => void
  onCustom?: () => void
  customSubtitle?: string | null
}

export function TaskDueDatePickerCommand({
  dueDate: dueDateProp,
  hasDueDate: hasDueDateProp,
  presets: presetsProp,
  onSelectDate: onSelectDateProp,
  onClear: onClearProp,
  onCustom: onCustomProp,
  customSubtitle,
}: TaskDueDatePickerCommandProps = {}) {
  const context = useOptionalTaskActionsContext()
  const dueDate = dueDateProp ?? context?.task.dueDate
  const hasDueDate = hasDueDateProp ?? dueDate != null
  const presets = presetsProp ?? context?.dueDatePresets ?? buildDueDatePresets()

  const onSelectDate =
    onSelectDateProp ??
    ((date: Date) => {
      context?.setDueDate(date)
    })

  const onClear = onClearProp ?? context?.clearDueDate
  const onCustom = onCustomProp ?? (() => context?.setCustomDueDateOpen(true))

  const resolvedCustomSubtitle =
    customSubtitle ??
    (dueDate != null ? format(new Date(dueDate), 'MMM d') : null)

  return (
    <Command>
      <CommandInput
        placeholder="Try: tomorrow, 7 days…"
        className="h-8 border-0 bg-transparent shadow-none"
      />
      <CommandList>
        <CommandEmpty>No matching date</CommandEmpty>
        <CommandGroup>
          {hasDueDate && onClear ? (
            <CommandItem
              value="remove due date"
              onSelect={() => onClear()}
            >
              <RiCalendarCloseLine className="size-3.5 text-muted-foreground" />
              <span className="flex-1">Remove due date</span>
            </CommandItem>
          ) : null}
          {onCustom ? (
            <CommandItem value="custom date picker" onSelect={() => onCustom()}>
              <RiCalendarLine className="size-3.5 text-muted-foreground" />
              <span className="flex-1">Custom…</span>
              {resolvedCustomSubtitle ? (
                <CommandShortcut>{resolvedCustomSubtitle}</CommandShortcut>
              ) : null}
            </CommandItem>
          ) : null}
          {presets.map((preset) => {
            const date = preset.getDate()
            return (
              <CommandItem
                key={preset.id}
                value={`${preset.label} ${format(date, 'MMM d')}`}
                onSelect={() => onSelectDate(date)}
              >
                <RiCalendarLine className="size-3.5 text-muted-foreground" />
                <span className="flex-1">{preset.label}</span>
                <CommandShortcut>{format(date, 'EEE, d MMM')}</CommandShortcut>
              </CommandItem>
            )
          })}
        </CommandGroup>
      </CommandList>
    </Command>
  )
}
