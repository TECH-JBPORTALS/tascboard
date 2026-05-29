'use client'

import { useMutation } from 'convex/react'
import { addDays, startOfDay } from 'date-fns'
import * as React from 'react'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { SPRINT_GOAL_MAX_LENGTH, type SprintStatus } from '@/lib/track-utils'

type SprintSnapshot = {
  _id: Id<'sprints'>
  goal: string
  startDate: number
  endDate: number
  status: SprintStatus
}

export function useSprintUpdate(sprint: SprintSnapshot) {
  const editSprint = useMutation(api.sprint.edit)

  const persist = React.useCallback(
    async (
      patch: Partial<
        Pick<SprintSnapshot, 'goal' | 'startDate' | 'endDate' | 'status'>
      >,
    ) => {
      await editSprint({
        sprintId: sprint._id,
        goal: patch.goal ?? sprint.goal,
        startDate: patch.startDate ?? sprint.startDate,
        endDate: patch.endDate ?? sprint.endDate,
        status: patch.status ?? sprint.status,
      })
    },
    [editSprint, sprint],
  )

  const handleGoalSave = React.useCallback(
    (goal: string) => {
      const trimmed = goal.trim().slice(0, SPRINT_GOAL_MAX_LENGTH)
      if (!trimmed || trimmed === sprint.goal) return
      void persist({ goal: trimmed })
    },
    [persist, sprint.goal],
  )

  const handleStartDateSelect = React.useCallback(
    (date: Date) => {
      const startDate = startOfDay(date).getTime()
      if (startDate === sprint.startDate) return

      let endDate = sprint.endDate
      if (endDate <= startDate) {
        endDate = startOfDay(addDays(date, 1)).getTime()
      }

      void persist({ startDate, endDate })
    },
    [persist, sprint.startDate, sprint.endDate],
  )

  const handleEndDateSelect = React.useCallback(
    (date: Date) => {
      const endDate = startOfDay(date).getTime()
      if (endDate <= sprint.startDate || endDate === sprint.endDate) return
      void persist({ endDate })
    },
    [persist, sprint.startDate, sprint.endDate],
  )

  const handleStatusSelect = React.useCallback(
    (status: SprintStatus) => {
      if (status === sprint.status) return
      void persist({ status })
    },
    [persist, sprint.status],
  )

  return {
    handleGoalSave,
    handleStartDateSelect,
    handleEndDateSelect,
    handleStatusSelect,
  }
}
