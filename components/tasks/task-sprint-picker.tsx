'use client'

import { RiRunLine } from '@remixicon/react'
import { useMutation, useQuery } from 'convex/react'
import * as React from 'react'
import { TaskSprintPickerCommand } from '@/components/tasks/command/task-sprint-picker.command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { type SprintPickerValue } from '@/lib/task-sprint-utils'
import { formatSprintLabel } from '@/lib/track-utils'
import { cn } from '@/lib/utils'

export type { SprintPickerValue }

type TaskSprintPickerBaseProps = {
  trackId: Id<'tracks'>
  value: SprintPickerValue | undefined
  trigger: React.ReactElement
  align?: 'start' | 'center' | 'end'
  className?: string
  placeholder?: string
}

type TaskSprintPickerProps = TaskSprintPickerBaseProps &
  (
    | {
        taskId: Id<'tasks'>
        onSelect?: (sprintId: SprintPickerValue) => void
      }
    | {
        taskId?: undefined
        onSelect: (sprintId: SprintPickerValue) => void
      }
  )

export function TaskSprintPicker({
  trackId,
  value,
  trigger,
  align = 'start',
  className,
  placeholder = 'Move to sprint…',
  ...mode
}: TaskSprintPickerProps) {
  const [open, setOpen] = React.useState(false)
  const updateTask = useMutation(api.task.update)

  const handleSelect = (sprintId: SprintPickerValue) => {
    if (mode.onSelect) {
      mode.onSelect(sprintId)
    } else if (mode.taskId) {
      void updateTask({
        taskId: mode.taskId,
        body: { sprintId },
      })
    }
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={trigger} />
      <PopoverContent
        className={cn('w-56 p-0', className)}
        align={align}
        sideOffset={4}
      >
        <TaskSprintPickerCommand
          trackId={trackId}
          value={value}
          onSelect={handleSelect}
          placeholder={placeholder}
        />
      </PopoverContent>
    </Popover>
  )
}

type TaskSprintIconProps = {
  className?: string
}

export function TaskSprintIcon({ className }: TaskSprintIconProps) {
  return (
    <RiRunLine
      className={cn('size-3.5 shrink-0 text-muted-foreground', className)}
    />
  )
}

export function useSprintDisplayLabel(
  trackId: Id<'tracks'>,
  sprintId: SprintPickerValue | undefined,
) {
  const sprints = useQuery(api.sprint.listByTrack, { trackId })
  if (!sprintId || !sprints) return null
  const sprint = sprints.find((item) => item._id === sprintId)
  return sprint ? formatSprintLabel(sprint.sprintNumber) : null
}
