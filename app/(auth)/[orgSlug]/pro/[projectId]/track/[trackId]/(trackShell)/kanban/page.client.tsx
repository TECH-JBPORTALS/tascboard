'use client'

import { useQuery } from 'convex-helpers/react/cache/hooks'
import { useParams } from 'next/navigation'
import { TrackKanbanBoard } from '@/components/tracks/track-kanban-board'
import { TrackKanbanSkeleton } from '@/components/tracks/track-kanban-skeleton'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'

export function TrackKanbanViewPage() {
  const params = useParams<{
    orgSlug: string
    projectId: string
    trackId: string
  }>()
  const trackId = params.trackId as Id<'tracks'>
  const projectId = params.projectId as Id<'projects'>

  const track = useQuery(api.track.get, { trackId })
  const project = useQuery(api.project.get, { projectId })
  const tasks = useQuery(api.task.list, { trackId })

  if (track === undefined || project === undefined || tasks === undefined) {
    return <TrackKanbanSkeleton />
  }

  if (track === null || project === null) {
    return null
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <TrackKanbanBoard
        track={track}
        projectId={projectId}
        projectName={project.name}
      />
    </div>
  )
}
