'use client'

import { RiAddLine, RiRunFill } from '@remixicon/react'
import { useQuery } from 'convex-helpers/react/cache/hooks'
import { isEmpty, isUndefined } from 'lodash'
import { useParams } from 'next/navigation'
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
  const sprints = useQuery(api.sprint.listByTrack, {
    trackId: trackId,
  })

  if (isUndefined(sprints)) return <Skeleton className={'w-full h-10'} />

  if (isEmpty(sprints))
    return (
      <div className="h-full flex items-center justify-center">
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
              <Button>
                <RiAddLine />
                Create Sprint
              </Button>
            </EmptyContent>
          </EmptyHeader>
        </Empty>
      </div>
    )

  return <TrackSprintsView sprints={sprints} />
}
