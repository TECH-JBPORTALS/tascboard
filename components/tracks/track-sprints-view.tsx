'use client'

import {
  Sprint,
  TrackSprintGroup,
} from '@/components/tracks/track-sprint-group'
import type { Doc, Id } from '@/convex/_generated/dataModel'

type TrackSprintsViewProps = {
  sprints: Sprint[]
  track: Doc<'tracks'>
  projectId: Id<'projects'>
}

export function TrackSprintsView({
  sprints,
  track,
  projectId,
}: TrackSprintsViewProps) {
  return (
    <div className="min-h-0 flex-1">
      {sprints.map((sprint) => (
        <TrackSprintGroup
          key={sprint._id}
          sprint={sprint}
          track={track}
          projectId={projectId}
        />
      ))}
    </div>
  )
}
