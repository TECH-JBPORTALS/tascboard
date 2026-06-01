'use client'

import { useMutation } from 'convex/react'
import * as React from 'react'
import { toast } from 'sonner'
import { api } from '@/convex/_generated/api'
import type { Doc } from '@/convex/_generated/dataModel'
import type { SprintStatus } from '@/lib/track-utils'

type UseSprintActionsArgs = {
  sprint: Doc<'sprints'>
}

export function useSprintActions({ sprint }: UseSprintActionsArgs) {
  const editSprint = useMutation(api.sprint.edit)
  const removeSprint = useMutation(api.sprint.remove)

  const setStatus = React.useCallback(
    (status: SprintStatus) => {
      if (status === sprint.status) return
      void editSprint({
        sprintId: sprint._id,
        goal: sprint.goal,
        startDate: sprint.startDate,
        endDate: sprint.endDate,
        status,
      })
    },
    [
      editSprint,
      sprint._id,
      sprint.endDate,
      sprint.goal,
      sprint.startDate,
      sprint.status,
    ],
  )

  const deleteSprint = React.useCallback(async () => {
    try {
      await removeSprint({ sprintId: sprint._id })
      toast.success('Sprint deleted')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete sprint',
      )
      throw error
    }
  }, [removeSprint, sprint._id])

  return {
    sprint,
    setStatus,
    deleteSprint,
  }
}

export type SprintActionsValue = ReturnType<typeof useSprintActions>
