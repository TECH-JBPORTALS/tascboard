'use client'

import { RiAddLine, RiRunFill } from '@remixicon/react'
import { useQuery } from 'convex/react'
import { isEmpty, isUndefined } from 'lodash'
import { useParams } from 'next/navigation'
import * as React from 'react'
import { CreateSprintDialog } from '@/components/tracks/create-sprint-dialog'
import { TrackSprintsView } from '@/components/tracks/track-sprints-view'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'

export function TrackSprintsViewPage() {
  const params = useParams<{
    orgSlug: string
    projectId: string
    trackId: string
  }>()
  const trackId = params.trackId as Id<'tracks'>
  const projectId = params.projectId as Id<'projects'>
  const [createOpen, setCreateOpen] = React.useState(false)
  const sprints = useQuery(api.sprint.listByTrack, { trackId })
  const track = useQuery(api.track.get, { trackId })

  if (isUndefined(sprints) || track === undefined) {
    return <Skeleton className="h-10 w-full" />
  }

  if (track === null) {
    return null
  }

  return (
    <>
      {isEmpty(sprints) ? (
        <div className="flex h-full items-center justify-center">
          <Empty>
            <EmptyMedia variant="icon" className="size-12">
              <RiRunFill className="size-10 text-muted-foreground" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>No sprints planned yet.</EmptyTitle>
              <EmptyDescription>
                No worries, create your first sprint to get started.
              </EmptyDescription>
              <EmptyContent>
                <Button type="button" onClick={() => setCreateOpen(true)}>
                  <RiAddLine />
                  Create Sprint
                </Button>
              </EmptyContent>
            </EmptyHeader>
          </Empty>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <TrackSprintsView
            sprints={sprints}
            track={track}
            projectId={projectId}
          />
        </div>
      )}

      <CreateSprintDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        trackId={trackId}
      />
    </>
  )
}
