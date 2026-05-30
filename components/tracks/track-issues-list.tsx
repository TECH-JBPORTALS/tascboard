'use client'

import { useQuery } from 'convex/react'
import { TrackStatusGroup } from '@/components/tracks/track-status-group'
import { useTrackTaskFiltersContext } from '@/components/tracks/track-task-filters-context'
import { api } from '@/convex/_generated/api'
import type { Doc, Id } from '@/convex/_generated/dataModel'
import { groupTasksByStatus, taskStatusOrder } from '@/lib/task-utils'

type TrackIssuesListProps = {
  track: Doc<'tracks'>
  projectId: Id<'projects'>
}

export function TrackIssuesList({ track, projectId }: TrackIssuesListProps) {
  const { listArgs, hasActiveFilters } = useTrackTaskFiltersContext()
  const tasks = useQuery(api.task.list, listArgs)

  if (tasks === undefined) {
    return (
      <p className="px-4 py-8 text-sm text-muted-foreground">Loading issues…</p>
    )
  }

  const byStatus = groupTasksByStatus(tasks)
  const visibleStatuses = taskStatusOrder.filter(
    (status) => byStatus[status].length > 0,
  )

  if (tasks.length === 0) {
    return (
      <p className="px-4 py-12 text-center text-sm text-muted-foreground">
        {hasActiveFilters
          ? 'No issues match the current filters.'
          : 'No issues yet. Use "New issue" to create one.'}
      </p>
    )
  }

  return (
    <div className="min-h-0 flex-1">
      {visibleStatuses.map((status) => (
        <TrackStatusGroup
          key={status}
          status={status}
          tasks={byStatus[status]}
          track={track}
          projectId={projectId}
        />
      ))}
    </div>
  )
}
