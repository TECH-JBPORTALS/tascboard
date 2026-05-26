'use client'

import { useQuery } from 'convex/react'
import { TrackStatusGroup } from '@/components/tracks/track-status-group'
import { api } from '@/convex/_generated/api'
import type { Doc, Id } from '@/convex/_generated/dataModel'
import { groupTasksByStatus, taskStatusOrder } from '@/lib/task-utils'

type TrackIssuesListProps = {
  track: Doc<'tracks'>
  projectId: Id<'projects'>
}

export function TrackIssuesList({ track, projectId }: TrackIssuesListProps) {
  const tasks = useQuery(api.task.listByTrack, { trackId: track._id })

  if (tasks === undefined) {
    return (
      <p className="px-4 py-8 text-sm text-muted-foreground">Loading issues…</p>
    )
  }

  const byStatus = groupTasksByStatus(tasks)
  const visibleStatuses = taskStatusOrder.filter(
    (status) => byStatus[status].length > 0,
  )

  if (visibleStatuses.length === 0) {
    return (
      <p className="px-4 py-12 text-center text-sm text-muted-foreground">
        No issues yet. Use &quot;New issue&quot; to create one.
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
