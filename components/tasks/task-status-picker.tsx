'use client'

import { useMutation } from 'convex/react'
import * as React from 'react'
import { TaskStatusPickerCommand } from '@/components/tasks/command/task-status-picker.command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { type TaskStatus, taskStatusConfig } from '@/lib/task-utils'
import { cn } from '@/lib/utils'

type TaskStatusPickerBaseProps = {
  value: TaskStatus
  trigger: React.ReactElement
  className?: string
  placeholder?: string
}

type TaskStatusPickerProps = TaskStatusPickerBaseProps &
  (
    | { taskId: Id<'tasks'>; onSelect?: (status: TaskStatus) => void }
    | { taskId?: undefined; onSelect: (status: TaskStatus) => void }
  )

export function TaskStatusPicker({
  value,
  trigger,
  className,
  placeholder = 'Change status…',
  ...mode
}: TaskStatusPickerProps) {
  const [open, setOpen] = React.useState(false)
  const updateTaskMutation = useMutation(api.task.update)

  const handleSelect = (status: TaskStatus) => {
    if (mode.onSelect) {
      mode.onSelect(status)
    } else if (mode.taskId) {
      void updateTaskMutation({ taskId: mode.taskId, body: { status } })
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
        <TaskStatusPickerCommand
          value={value}
          onSelect={handleSelect}
          placeholder={placeholder}
        />
      </PopoverContent>
    </Popover>
  )
}

type TaskStatusIconProps = {
  status: TaskStatus
  className?: string
}

export function TaskStatusIcon({ status, className }: TaskStatusIconProps) {
  const config = taskStatusConfig[status]
  const Icon = config.icon

  return (
    <Icon className={cn('size-4 shrink-0', config.iconClassName, className)} />
  )
}
