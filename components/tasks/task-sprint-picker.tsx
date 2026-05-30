'use client'

import { RiCloseCircleLine, RiRunLine, RiTextBlock } from '@remixicon/react'
import { useMutation, useQuery } from 'convex/react'
import * as React from 'react'
import { TaskCommandPopover } from '@/components/tasks/task-command-popover'
import { SprintStatusIcon } from '@/components/tracks/sprint-status-picker'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { formatSprintLabel } from '@/lib/track-utils'
import { cn } from '@/lib/utils'

const NO_SPRINT_VALUE = '__no_sprint__'

export type SprintPickerValue = Id<'sprints'> | null

function toPickerValue(sprintId: SprintPickerValue | undefined): string {
  return sprintId ?? NO_SPRINT_VALUE
}

function fromPickerValue(selected: string): SprintPickerValue {
  return selected === NO_SPRINT_VALUE ? null : (selected as Id<'sprints'>)
}

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
  const sprints = useQuery(api.sprint.listByTrack, { trackId })
  const updateTask = useMutation(api.task.update)

  const options = React.useMemo(() => {
    const sprintOptions =
      sprints?.map((sprint) => ({
        value: sprint._id,
        label: formatSprintLabel(sprint.sprintNumber),
        keywords: sprint.goal,
        icon: <SprintStatusIcon status={sprint.status} className="size-3.5" />,
      })) ?? []

    return [
      {
        value: NO_SPRINT_VALUE,
        label: 'No sprint',
        keywords: 'backlog unassigned',
        icon: <RiCloseCircleLine className="size-3.5 text-muted-foreground" />,
      },
      ...sprintOptions,
    ]
  }, [sprints])

  const handleSelect = (selected: string) => {
    const sprintId = fromPickerValue(selected)

    if (mode.onSelect) {
      mode.onSelect(sprintId)
      return
    }

    if (mode.taskId) {
      void updateTask({
        taskId: mode.taskId,
        body: { sprintId },
      })
    }
  }

  return (
    <TaskCommandPopover
      open={open}
      onOpenChange={setOpen}
      trigger={trigger}
      placeholder={placeholder}
      shortcutKey="R"
      options={options}
      value={toPickerValue(value)}
      onSelect={handleSelect}
      align={align}
      className={className}
      emptyMessage="No sprints found"
    />
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
