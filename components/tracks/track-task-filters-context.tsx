'use client'

import { useQuery } from 'convex/react'
import * as React from 'react'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import {
  type TrackTaskFiltersValue,
  useTrackTaskFilters,
} from '@/hooks/use-track-task-filters'
import type { TrackTaskView } from '@/lib/track-task-filters'

const TrackTaskFiltersContext =
  React.createContext<TrackTaskFiltersValue | null>(null)

type TrackTaskFiltersProviderProps = {
  trackId: Id<'tracks'>
  projectId: Id<'projects'>
  view?: TrackTaskView
  children: React.ReactNode
}

export function TrackTaskFiltersProvider({
  trackId,
  projectId,
  view,
  children,
}: TrackTaskFiltersProviderProps) {
  const employees = useQuery(api.task.listTaskEmployees, { trackId })
  const labels = useQuery(api.label.listByProject, { projectId })
  const sprints = useQuery(api.sprint.listByTrack, { trackId })

  const assigneeNames = React.useMemo(() => {
    const map: Record<string, string> = {}
    for (const member of employees ?? []) {
      map[member.employeeId] = member.employee.name || member.employeeId
    }
    return map
  }, [employees])

  const labelNames = React.useMemo(() => {
    const map: Record<string, string> = {}
    for (const label of labels ?? []) {
      map[label._id] = label.name
    }
    return map
  }, [labels])

  const sprintNames = React.useMemo(() => {
    const map: Record<string, string> = {}
    for (const sprint of sprints ?? []) {
      map[sprint._id] = `Sprint ${sprint.sprintNumber}`
    }
    return map
  }, [sprints])

  const filters = useTrackTaskFilters({
    trackId,
    view,
    assigneeNames,
    labelNames,
    sprintNames,
  })

  return (
    <TrackTaskFiltersContext.Provider value={filters}>
      {children}
    </TrackTaskFiltersContext.Provider>
  )
}

export function useTrackTaskFiltersContext(): TrackTaskFiltersValue {
  const ctx = React.useContext(TrackTaskFiltersContext)
  if (!ctx) {
    throw new Error(
      'useTrackTaskFiltersContext must be used within TrackTaskFiltersProvider',
    )
  }
  return ctx
}
