'use client'

import { useQuery } from 'convex/react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { TrackView } from '@/components/tracks/track-view'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'

export default function TrackPage() {
  const params = useParams<{
    orgSlug: string
    projectId: string
    trackId: string
  }>()

  const projectId = params.projectId as Id<'projects'>
  const trackId = params.trackId as Id<'tracks'>

  const project = useQuery(api.project.get, { projectId })
  const track = useQuery(api.track.get, { trackId })

  if (project === undefined || track === undefined) {
    return <TrackPageSkeleton />
  }

  if (project === null || track === null) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-muted-foreground">Track not found.</p>
        <Button render={<Link href={`/${params.orgSlug}/pro/${projectId}`} />}>
          Back to project
        </Button>
      </div>
    )
  }

  if (track.projectId !== project._id) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-muted-foreground">
          This track does not belong to the project.
        </p>
        <Button render={<Link href={`/${params.orgSlug}/pro/${projectId}`} />}>
          Back to project
        </Button>
      </div>
    )
  }

  return <TrackView orgSlug={params.orgSlug} project={project} track={track} />
}

function TrackPageSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <PageHeader
          title={<Skeleton className="h-4 w-56" />}
          description={<Skeleton className="h-3 w-40" />}
          actions={<Skeleton className="h-8 w-32" />}
        />
        <div className="space-y-4 px-6 py-6">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="min-h-[40vh] w-full" />
        </div>
      </div>
    </div>
  )
}
