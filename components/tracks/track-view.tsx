'use client'

import { useQuery } from 'convex/react'
import { useParams } from 'next/navigation'
import { TrackIssuesList } from '@/components/tracks/track-issues-list'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'

export function TrackView() {
  const params = useParams<{
    projectId: string
    trackId: string
  }>()
  const projectId = params.projectId as Id<'projects'>
  const trackId = params.trackId as Id<'tracks'>

  const track = useQuery(api.track.get, { trackId })

  if (track === undefined) {
    return (
      <p className="px-4 py-8 text-sm text-muted-foreground">Loading issues…</p>
    )
  }

  if (track === null) {
    return null
  }

  return <TrackIssuesList track={track} projectId={projectId} />
}
