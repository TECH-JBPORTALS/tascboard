'use client'

import { RiSubtractLine } from '@remixicon/react'
import { useMutation } from 'convex/react'
import * as React from 'react'
import { TaskPriorityPickerCommand } from '@/components/tasks/command/task-priority-picker.command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import {
  type TaskPriority,
  taskPriorityConfig,
} from '@/lib/task-utils'
import { cn } from '@/lib/utils'

type TaskPriorityPickerBaseProps = {
  value: TaskPriority
  trigger: React.ReactElement
  className?: string
  placeholder?: string
}

type TaskPriorityPickerProps = TaskPriorityPickerBaseProps &
  (
    | { taskId: Id<'tasks'>; onSelect?: (priority: TaskPriority) => void }
    | { taskId?: undefined; onSelect: (priority: TaskPriority) => void }
  )

export function TaskPriorityPicker({
  value,
  trigger,
  className,
  placeholder = 'Change priority to…',
  ...mode
}: TaskPriorityPickerProps) {
  const [open, setOpen] = React.useState(false)
  const updateTaskMutation = useMutation(api.task.update)

  const handleSelect = (priority: TaskPriority) => {
    if (mode.onSelect) {
      mode.onSelect(priority)
    } else if (mode.taskId) {
      void updateTaskMutation({ taskId: mode.taskId, body: { priority } })
    }
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={trigger} />
      <PopoverContent
        className={cn('w-56 p-0', className)}
        align="start"
        sideOffset={4}
      >
        <TaskPriorityPickerCommand
          value={value}
          onSelect={handleSelect}
          placeholder={placeholder}
        />
      </PopoverContent>
    </Popover>
  )
}

type TaskPriorityIconProps = {
  priority: TaskPriority
  className?: string
}

export function TaskPriorityIcon({
  priority,
  className,
}: TaskPriorityIconProps) {
  const config = taskPriorityConfig[priority]
  const Icon = config.icon

  if (priority === 'medium') {
    return (
      <span
        className={cn(
          'inline-flex size-3.5 items-center justify-center',
          className,
        )}
      >
        <RiSubtractLine className="size-3 text-muted-foreground" />
      </span>
    )
  }

  return (
    <Icon
      className={cn('size-3.5 shrink-0', config.iconClassName, className)}
    />
  )
}
