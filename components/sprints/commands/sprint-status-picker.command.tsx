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
import { SprintStatusIcon } from '../sprint-status-picker'

type SprintStatusPickerCommandProps = {
  value: SprintStatus
  onSelect: (status: SprintStatus) => void
  placeholder?: string
}

export function SprintStatusPickerCommand({
  value,
  onSelect,
  placeholder = 'Change status…',
}: SprintStatusPickerCommandProps) {
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
