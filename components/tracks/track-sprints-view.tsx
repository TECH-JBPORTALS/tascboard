'use client'

import {
  Sprint,
  TrackSprintGroup,
} from '@/components/tracks/track-sprint-group'

type TrackSprintsViewProps = {
  sprints: Sprint[]
}

export function TrackSprintsView({ sprints }: TrackSprintsViewProps) {
  return (
    <div className="min-h-0 flex-1">
      {sprints.map((sprint) => (
        <TrackSprintGroup key={sprint._id} sprint={sprint} />
      ))}
    </div>
  )
}
