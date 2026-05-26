'use client'

import { RiAddLine, RiFilter3Line, RiLayoutGridLine } from '@remixicon/react'
import { useQuery } from 'convex/react'
import * as React from 'react'
import { CreateTaskDialog } from '@/components/tasks/CreateTaskDialog'
import { TrackIssuesList } from '@/components/tracks/track-issues-list'
import { TrackPageHeader } from '@/components/tracks/track-page-header'
import { Button } from '@/components/ui/button'
import { api } from '@/convex/_generated/api'
import type { Doc } from '@/convex/_generated/dataModel'
import { cn } from '@/lib/utils'

type TrackViewProps = {
  orgSlug: string
  project: Doc<'projects'>
  track: Doc<'tracks'>
}

export function TrackView({ orgSlug, project, track }: TrackViewProps) {
  const tasks = useQuery(api.task.listByTrack, { trackId: track._id })
  const [createOpen, setCreateOpen] = React.useState(false)

  const issueCount = tasks?.length ?? 0

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <TrackPageHeader
        orgSlug={orgSlug}
        project={project}
        track={track}
        issueCount={issueCount}
        actions={
          <>
            <Button type="button" variant="outline" size="sm" disabled>
              <RiFilter3Line className="size-4" />
              Filter
            </Button>
            <Button type="button" variant="outline" size="sm" disabled>
              <RiLayoutGridLine className="size-4" />
              Display
            </Button>
            <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
              <RiAddLine className="size-4" />
              New issue
            </Button>
          </>
        }
      />

      <div className="shrink-0 border-b border-border/60 px-4">
        <div className="flex h-10 items-center gap-1">
          <ViewTab active>All issues</ViewTab>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <TrackIssuesList track={track} projectId={project._id} />
      </div>

      <CreateTaskDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        track={track}
        projectId={project._id}
      />
    </div>
  )
}

function ViewTab({
  children,
  active,
}: {
  children: React.ReactNode
  active?: boolean
}) {
  return (
    <span
      className={cn(
        'rounded-md px-2.5 py-1 text-sm font-medium',
        active ? 'bg-muted text-foreground' : 'text-muted-foreground',
      )}
    >
      {children}
    </span>
  )
}
