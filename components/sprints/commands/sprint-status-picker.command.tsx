'use client'

import { RiCheckLine } from '@remixicon/react'
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
  type SprintStatus,
  sprintStatusConfig,
  sprintStatusOrder,
} from '@/lib/track-utils'
import { useOptionalSprintActionsContext } from '../sprint-actions-provider'
import { SprintStatusIcon } from '../sprint-status-picker'

type SprintStatusPickerCommandProps = {
  value?: SprintStatus
  onSelect?: (status: SprintStatus) => void
  placeholder?: string
}

export function SprintStatusPickerCommand({
  value: valueProp,
  onSelect: onSelectProp,
  placeholder = 'Change status…',
}: SprintStatusPickerCommandProps = {}) {
  const context = useOptionalSprintActionsContext()
  const value = valueProp ?? context?.sprint.status
  const onSelect = onSelectProp ?? context?.setStatus

  if (value == null || onSelect == null) {
    throw new Error(
      'SprintStatusPickerCommand requires value and onSelect via props or SprintActionsProvider',
    )
  }

  return (
    <Command>
      <CommandInput placeholder={placeholder} />
      <CommandList>
        <CommandEmpty>No status found</CommandEmpty>
        <CommandGroup>
          {sprintStatusOrder.map((status) => {
            const config = sprintStatusConfig[status]
            return (
              <CommandItem
                key={status}
                value={`${config.label} ${status}`}
                data-checked={value === status}
                onSelect={() => onSelect(status)}
              >
                <SprintStatusIcon status={status} className="size-3.5" />
                <span className="flex-1">{config.label}</span>
                {value === status ? (
                  <CommandShortcut>
                    <RiCheckLine />
                  </CommandShortcut>
                ) : (
                  <CommandShortcut>{config.shortcut}</CommandShortcut>
                )}
              </CommandItem>
            )
          })}
        </CommandGroup>
      </CommandList>
    </Command>
  )
}
