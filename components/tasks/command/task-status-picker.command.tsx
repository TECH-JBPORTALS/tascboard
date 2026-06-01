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
  type TaskStatus,
  taskStatusConfig,
  taskStatusOrder,
} from '@/lib/task-utils'
import { useOptionalTaskActionsContext } from '../task-actions-provider'
import { TaskStatusIcon } from '../task-status-picker'

type TaskStatusPickerCommandProps = {
  value?: TaskStatus
  onSelect?: (status: TaskStatus) => void
  placeholder?: string
}

export function TaskStatusPickerCommand({
  value: valueProp,
  onSelect: onSelectProp,
  placeholder = 'Change status…',
}: TaskStatusPickerCommandProps = {}) {
  const context = useOptionalTaskActionsContext()
  const value = valueProp ?? context?.task.status
  const onSelect = onSelectProp ?? context?.setStatus

  if (value == null || onSelect == null) {
    throw new Error(
      'TaskStatusPickerCommand requires value and onSelect via props or TaskActionsProvider',
    )
  }

  return (
    <Command>
      <CommandInput placeholder={placeholder} />
      <CommandList>
        <CommandEmpty>No status found</CommandEmpty>
        <CommandGroup>
          {taskStatusOrder.map((status) => {
            const config = taskStatusConfig[status]
            return (
              <CommandItem
                key={status}
                value={`${config.label} ${status}`}
                data-checked={value === status}
                onSelect={() => onSelect(status)}
              >
                <TaskStatusIcon status={status} className="size-3.5" />
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
