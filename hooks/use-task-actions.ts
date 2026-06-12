'use client'

import { useMutation, useQuery } from 'convex/react'
import { startOfDay } from 'date-fns'
import * as React from 'react'
import { toast } from 'sonner'
import { api } from '@/convex/_generated/api'
import type { Doc, Id } from '@/convex/_generated/dataModel'
import { useActor } from '@/hooks/use-actor'
import { useTaskMemberGroups } from '@/hooks/use-task-member-groups'
import {
  buildDueDatePresets,
  getDueDateRadioValue,
} from '@/lib/task-due-date-presets'
import {
  fromSprintPickerValue,
  type SprintPickerValue,
  toSprintPickerValue,
} from '@/lib/task-sprint-utils'
import type { TaskPriority, TaskStatus } from '@/lib/task-utils'
import { formatSprintLabel } from '@/lib/track-utils'

type UseTaskActionsArgs = {
  task: Doc<'tasks'>
}

export function useTaskActions({ task }: UseTaskActionsArgs) {
  const { deviceName } = useActor()
  const updateTask = useMutation(api.task.update)
  const removeTask = useMutation(api.task.remove)
  const toggleMember = useMutation(api.taskMember.toggleMember)
  const attachLabel = useMutation(api.label.attachToTask)
  const detachLabel = useMutation(api.label.detachFromTask)

  const sprints = useQuery(api.sprint.listByTrack, { trackId: task.trackId })
  const projectLabels = useQuery(api.label.listByProject, {
    projectId: task.projectId,
  })
  const attachedLabels = useQuery(api.label.listTaskLabels, {
    taskId: task._id,
  })

  const memberGroups = useTaskMemberGroups(task._id, task.trackId)

  const attachedLabelIds = React.useMemo(
    () => new Set((attachedLabels ?? []).map((label) => label._id)),
    [attachedLabels],
  )

  const dueDatePresets = React.useMemo(() => buildDueDatePresets(), [])
  const dueDateRadioValue = getDueDateRadioValue(task.dueDate, dueDatePresets)
  const sprintRadioValue = toSprintPickerValue(task.sprintId)

  const setStatus = React.useCallback(
    (status: TaskStatus) => {
      void updateTask({ taskId: task._id, body: { status } })
    },
    [task._id, updateTask],
  )

  const setPriority = React.useCallback(
    (priority: TaskPriority) => {
      void updateTask({ taskId: task._id, body: { priority } })
    },
    [task._id, updateTask],
  )

  const setSprint = React.useCallback(
    (sprintId: SprintPickerValue) => {
      void updateTask({ taskId: task._id, body: { sprintId } })
    },
    [task._id, updateTask],
  )

  const setSprintFromRadio = React.useCallback(
    (value: string) => {
      setSprint(fromSprintPickerValue(value))
    },
    [setSprint],
  )

  const setDueDate = React.useCallback(
    (date: Date | null) => {
      void updateTask({
        taskId: task._id,
        body: { dueDate: date ? startOfDay(date).getTime() : null },
      })
    },
    [task._id, updateTask],
  )

  const setDueDatePreset = React.useCallback(
    (presetId: string) => {
      const preset = dueDatePresets.find((item) => item.id === presetId)
      if (!preset) return
      setDueDate(preset.getDate())
    },
    [dueDatePresets, setDueDate],
  )

  const clearDueDate = React.useCallback(() => {
    setDueDate(null)
  }, [setDueDate])

  const toggleAssignee = React.useCallback(
    (employeeId: string) => {
      void toggleMember({ taskId: task._id, employeeId })
    },
    [task._id, toggleMember],
  )

  const toggleLabel = React.useCallback(
    async (labelId: Id<'labels'>) => {
      if (attachedLabelIds.has(labelId)) {
        await detachLabel({ taskId: task._id, labelId, deviceName })
      } else {
        await attachLabel({ taskId: task._id, labelId, deviceName })
      }
    },
    [attachedLabelIds, attachLabel, detachLabel, deviceName, task._id],
  )

  const deleteTask = React.useCallback(async () => {
    try {
      await removeTask({ taskId: task._id })
      toast.success('Task deleted')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete task',
      )
      throw error
    }
  }, [removeTask, task._id])

  const sprintOptions = React.useMemo(() => {
    const sprintItems =
      sprints?.map((sprint) => ({
        value: sprint._id,
        label: formatSprintLabel(sprint.sprintNumber),
      })) ?? []

    return [
      { value: '__no_sprint__' as const, label: 'No sprint' },
      ...sprintItems,
    ]
  }, [sprints])

  return {
    task,
    sprints: sprints ?? [],
    sprintOptions,
    sprintRadioValue,
    projectLabels: projectLabels ?? [],
    attachedLabels: attachedLabels ?? [],
    attachedLabelIds,
    dueDatePresets,
    dueDateRadioValue,
    memberGroups,
    setStatus,
    setPriority,
    setSprint,
    setSprintFromRadio,
    setDueDate,
    setDueDatePreset,
    clearDueDate,
    toggleAssignee,
    toggleLabel,
    deleteTask,
  }
}

export type TaskActionsValue = ReturnType<typeof useTaskActions>
