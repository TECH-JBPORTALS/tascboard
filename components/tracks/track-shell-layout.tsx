'use client'

import { useQuery } from 'convex/react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { TrackShell } from '@/components/tracks/track-shell'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'

type TrackShellLayoutProps = {
  children: React.ReactNode
}

export function TrackShellLayout({ children }: TrackShellLayoutProps) {
  const params = useParams<{
    orgSlug: string
    projectId: string
    trackId: string
  }>()
  const projectId = params.projectId as Id<'projects'>
  const trackId = params.trackId as Id<'tracks'>

  const project = useQuery(api.project.get, { projectId })
  const track = useQuery(api.track.get, { trackId })
  const tasks = useQuery(api.task.listByTrack, { trackId })

  if (project === undefined || track === undefined || tasks === undefined) {
    return <TrackShellPageSkeleton />
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

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <TrackShell
        orgSlug={params.orgSlug}
        project={project}
        track={track}
        issueCount={tasks.length}
      >
        {children}
      </TrackShell>
    </div>
  )
}

function TrackShellPageSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="sticky top-0 z-20 shrink-0 bg-sidebar backdrop-blur supports-backdrop-filter:bg-sidebar/80">
        <PageHeader
          className="static z-auto"
          title={<Skeleton className="h-4 w-56" />}
          description={<Skeleton className="h-3 w-40" />}
          actions={<Skeleton className="h-8 w-32" />}
        />
        <div className="border-b px-2 py-2">
          <Skeleton className="h-8 w-56" />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-4 px-6 py-6">
          <Skeleton className="min-h-[40vh] w-full" />
        </div>
      </div>
    </div>
  )
}
