'use client'

import { RiAddFill } from '@remixicon/react'
import { useMutation } from 'convex/react'
import * as React from 'react'
import { LabelDot } from '@/components/labels/label-create-popover'
import { TaskLabelPickerCommand } from '@/components/tasks/command/task-label-picker.command'
import { useOptionalTaskActionsContext } from '@/components/tasks/task-actions-provider'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { api } from '@/convex/_generated/api'
import type { Doc, Id } from '@/convex/_generated/dataModel'
import { useActor } from '@/hooks/use-actor'

type TaskLabelPickerProps = {
  taskId: Id<'tasks'>
  projectId: Id<'projects'>
  projectName: string
  attachedLabels: Doc<'labels'>[]
  onToggleLabel?: (labelId: Id<'labels'>) => void
}

export function TaskLabelPicker({
  taskId,
  projectId,
  projectName,
  attachedLabels,
  onToggleLabel,
}: TaskLabelPickerProps) {
  const [open, setOpen] = React.useState(false)
  const taskActions = useOptionalTaskActionsContext()
  const { deviceName } = useActor()
  const attachLabel = useMutation(api.label.attachToTask)
  const detachLabel = useMutation(api.label.detachFromTask)

  const attachedIds = new Set(attachedLabels.map((l) => l._id))

  async function handleToggle(labelId: Id<'labels'>) {
    if (onToggleLabel) {
      onToggleLabel(labelId)
      return
    }
    if (taskActions) {
      await taskActions.toggleLabel(labelId)
      return
    }
    if (attachedIds.has(labelId)) {
      await detachLabel({ taskId, labelId, deviceName })
    } else {
      await attachLabel({ taskId, labelId, deviceName })
    }
  }

  return (
    <div className="flex space-x-1">
      <div className="flex flex-wrap gap-1.5">
        {attachedLabels.map((label) => (
          <Button
            key={label._id}
            type="button"
            variant="outline"
            size="xs"
            className="rounded-full"
            onClick={() => void handleToggle(label._id)}
          >
            <LabelDot color={label.color} />
            {label.name}
          </Button>
        ))}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size={attachedLabels.length > 0 ? 'icon-xs' : 'xs'}
              className="rounded-full"
            />
          }
        >
          <RiAddFill className="size-3.5" />
          {attachedLabels.length === 0 && 'Add label'}
        </PopoverTrigger>

        <PopoverContent className="w-fit p-0" align="end">
          <TaskLabelPickerCommand
            projectId={projectId}
            projectName={projectName}
            taskId={taskId}
            attachedLabelIds={attachedIds}
            onToggle={onToggleLabel ? handleToggle : undefined}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
