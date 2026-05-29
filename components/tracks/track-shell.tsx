'use client'

import {
  RiAddLine,
  RiCalendarView,
  RiKanbanView,
  RiKanbanView2,
  RiRunFill,
  RiRunLine,
  RiTableView,
} from '@remixicon/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as React from 'react'
import { CreateTaskDialog } from '@/components/tasks/create-task-dialog'
import { TrackPageHeader } from '@/components/tracks/track-page-header'
import { Button } from '@/components/ui/button'
import type { Doc } from '@/convex/_generated/dataModel'
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs'
import { CreateSprintDialog } from './create-sprint-dialog'

type TrackShellProps = {
  orgSlug: string
  project: Doc<'projects'>
  track: Doc<'tracks'>
  issueCount: number
  children: React.ReactNode
}

const getItems = ({
  orgSlug,
  projectId,
  trackId,
}: {
  orgSlug: string
  projectId: string
  trackId: string
}) => [
  {
    id: 1,
    label: 'Status',
    icon: RiTableView,
    href: `/${orgSlug}/pro/${projectId}/track/${trackId}`,
  },
  {
    id: 2,
    label: 'Sprints',
    icon: RiRunLine,
    href: `/${orgSlug}/pro/${projectId}/track/${trackId}/sprints`,
  },
  {
    id: 3,
    label: 'Kanban',
    icon: RiKanbanView2,
    href: `/${orgSlug}/pro/${projectId}/track/${trackId}/kanban`,
  },
]

export function TrackShell({
  orgSlug,
  project,
  track,
  issueCount,
  children,
}: TrackShellProps) {
  const [createOpen, setCreateOpen] = React.useState(false)
  const [createSprintOpen, setSprintOpen] = React.useState(false)
  const pathname = usePathname()
  const items = React.useMemo(
    () =>
      getItems({
        orgSlug,
        projectId: project._id,
        trackId: track._id,
      }),
    [orgSlug, project._id, track._id],
  )

  return (
    <div className="flex max-h-svh min-h-0 flex-1 flex-col overflow-hidden">
      <div className="sticky top-0 z-20 shrink-0 bg-sidebar backdrop-blur supports-backdrop-filter:bg-sidebar/80">
        <TrackPageHeader
          orgSlug={orgSlug}
          project={project}
          track={track}
          issueCount={issueCount}
          className="static z-auto"
          actions={
            <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
              <RiAddLine className="size-4" />
              New task
            </Button>
          }
        />

        <div className="flex shrink-0 items-center justify-between border-b px-2">
          <Tabs value={pathname}>
            <TabsList variant="line">
              {items.map((item) => (
                <TabsTrigger
                  key={item.id}
                  value={item.href}
                  render={<Link href={item.href} />}
                  nativeButton={false}
                >
                  <item.icon />
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <Button
            size={'sm'}
            onClick={() => setSprintOpen(true)}
            variant={'ghost'}
          >
            <RiAddLine /> New sprint
          </Button>
          <CreateSprintDialog
            open={createSprintOpen}
            onOpenChange={setSprintOpen}
            trackId={track._id}
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>

      <CreateTaskDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        track={track}
        projectId={project._id}
      />
    </div>
  )
}
