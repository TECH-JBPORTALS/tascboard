'use client'

import { usePathname } from 'next/navigation'
import { useQueryStates } from 'nuqs'
import * as React from 'react'
import type { Id } from '@/convex/_generated/dataModel'
import type { TaskStatus } from '@/lib/task-utils'
import {
  type ActiveTrackTaskFilter,
  buildActiveFilters,
  buildTaskListArgs,
  type DueDatePreset,
  getAvailableFilterTypes,
  getTrackTaskView,
  hasActiveFilters,
  type TaskListFilterArgs,
  type TrackTaskFilterType,
  type TrackTaskFilterUrlState,
  type TrackTaskView,
  trackTaskFilterParsers,
} from '@/lib/track-task-filters'

export type UseTrackTaskFiltersOptions = {
  trackId: Id<'tracks'>
  view?: TrackTaskView
  /** Per-sprint group in sprints view */
  sprintId?: Id<'sprints'>
  assigneeNames?: Record<string, string>
  labelNames?: Record<string, string>
  sprintNames?: Record<string, string>
}

export function useTrackTaskFilters({
  trackId,
  view: viewProp,
  sprintId: groupSprintId,
  assigneeNames,
  labelNames,
  sprintNames,
}: UseTrackTaskFiltersOptions) {
  const pathname = usePathname()
  const view = viewProp ?? getTrackTaskView(pathname)

  const [params, setParams] = useQueryStates(trackTaskFilterParsers, {
    history: 'replace',
    shallow: true,
  })

  const urlState: TrackTaskFilterUrlState = React.useMemo(
    () => ({
      assigneeIds: params.assignee,
      labelIds: params.label,
      statuses: params.status,
      sprintId: (params.sprint as Id<'sprints'> | null) ?? null,
      duePreset: params.due,
      dueFrom: params.dueFrom,
      dueTo: params.dueTo,
    }),
    [params],
  )

  const listArgs = React.useMemo(
    (): TaskListFilterArgs =>
      buildTaskListArgs(trackId, urlState, {
        sprintId: groupSprintId,
        view,
      }),
    [trackId, urlState, groupSprintId, view],
  )

  const activeFilters = React.useMemo(
    () =>
      buildActiveFilters(urlState, {
        assigneeNames,
        labelNames,
        sprintNames,
      }),
    [urlState, assigneeNames, labelNames, sprintNames],
  )

  const availableFilterTypes = React.useMemo(
    () => getAvailableFilterTypes(view),
    [view],
  )

  const addAssignee = React.useCallback(
    (employeeId: string) => {
      if (urlState.assigneeIds.includes(employeeId)) return
      void setParams({
        assignee: [...urlState.assigneeIds, employeeId],
      })
    },
    [urlState.assigneeIds, setParams],
  )

  const addLabel = React.useCallback(
    (labelId: Id<'labels'>) => {
      if (urlState.labelIds.includes(labelId)) return
      void setParams({
        label: [...urlState.labelIds, labelId],
      })
    },
    [urlState.labelIds, setParams],
  )

  const addStatus = React.useCallback(
    (status: TaskStatus) => {
      if (urlState.statuses.includes(status)) return
      void setParams({
        status: [...urlState.statuses, status],
      })
    },
    [urlState.statuses, setParams],
  )

  const setSprint = React.useCallback(
    (sprintId: Id<'sprints'>) => {
      void setParams({ sprint: sprintId })
    },
    [setParams],
  )

  const setDuePreset = React.useCallback(
    (preset: DueDatePreset) => {
      if (preset === 'custom') {
        void setParams({ due: 'custom' })
        return
      }
      void setParams({
        due: preset,
        dueFrom: null,
        dueTo: null,
      })
    },
    [setParams],
  )

  const setDueRange = React.useCallback(
    (from: number | null, to: number | null) => {
      void setParams({
        due: 'custom',
        dueFrom: from,
        dueTo: to,
      })
    },
    [setParams],
  )

  const removeFilter = React.useCallback(
    (filter: ActiveTrackTaskFilter) => {
      switch (filter.type) {
        case 'assignee':
          void setParams({
            assignee: urlState.assigneeIds.filter((id) => id !== filter.value),
          })
          break
        case 'label':
          void setParams({
            label: urlState.labelIds.filter((id) => id !== filter.value),
          })
          break
        case 'status':
          void setParams({
            status: urlState.statuses.filter((s) => s !== filter.value),
          })
          break
        case 'sprint':
          void setParams({ sprint: null })
          break
        case 'due':
          void setParams({
            due: null,
            dueFrom: null,
            dueTo: null,
          })
          break
      }
    },
    [urlState, setParams],
  )

  const clearAll = React.useCallback(() => {
    void setParams({
      assignee: [],
      label: [],
      status: [],
      sprint: null,
      due: null,
      dueFrom: null,
      dueTo: null,
    })
  }, [setParams])

  const listArgsForSprint = React.useCallback(
    (sprintId: Id<'sprints'>): TaskListFilterArgs =>
      buildTaskListArgs(trackId, urlState, { sprintId, view: 'sprints' }),
    [trackId, urlState],
  )

  return {
    view,
    urlState,
    listArgs,
    listArgsForSprint,
    activeFilters,
    availableFilterTypes,
    hasActiveFilters: hasActiveFilters(urlState),
    addAssignee,
    addLabel,
    addStatus,
    setSprint,
    setDuePreset,
    setDueRange,
    removeFilter,
    clearAll,
  }
}

export type TrackTaskFiltersValue = ReturnType<typeof useTrackTaskFilters>
