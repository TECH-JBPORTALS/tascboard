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
  type TaskPriority,
  taskPriorityConfig,
  taskPriorityOrder,
} from '@/lib/task-utils'
import { useOptionalTaskActionsContext } from '../task-actions-provider'
import { TaskPriorityIcon } from '../task-priority-picker'

type TaskPriorityPickerCommandProps = {
  value?: TaskPriority
  onSelect?: (priority: TaskPriority) => void
  placeholder?: string
}

export function TaskPriorityPickerCommand({
  value: valueProp,
  onSelect: onSelectProp,
  placeholder = 'Change priority to…',
}: TaskPriorityPickerCommandProps = {}) {
  const context = useOptionalTaskActionsContext()
  const value = valueProp ?? context?.task.priority
  const onSelect = onSelectProp ?? context?.setPriority

  if (value == null || onSelect == null) {
    throw new Error(
      'TaskPriorityPickerCommand requires value and onSelect via props or TaskActionsProvider',
    )
  }

  return (
    <Command>
      <CommandInput placeholder={placeholder} />
      <CommandList>
        <CommandEmpty>No priority found</CommandEmpty>
        <CommandGroup>
          {taskPriorityOrder.map((priority) => {
            const config = taskPriorityConfig[priority]
            return (
              <CommandItem
                key={priority}
                value={`${config.label} ${priority}`}
                data-checked={value === priority}
                onSelect={() => onSelect(priority)}
              >
                <TaskPriorityIcon priority={priority} className="size-3.5" />
                <span className="flex-1">{config.label}</span>
                {value === priority ? (
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
