'use client'

import { RiArrowRightSLine, RiRouteLine } from '@remixicon/react'
import Link from 'next/link'
import type * as React from 'react'
import { PageHeader } from '@/components/ui/page-header'
import type { Doc } from '@/convex/_generated/dataModel'
import { trackStatusLabels } from '@/lib/track-utils'
import { cn } from '@/lib/utils'

type TrackPageHeaderProps = {
  orgSlug: string
  project: Doc<'projects'>
  track: Doc<'tracks'>
  issueCount: number
  actions?: React.ReactNode
  className?: string
}

export function TrackPageHeader({
  orgSlug,
  project,
  track,
  issueCount,
  actions,
  className,
}: TrackPageHeaderProps) {
  const isActive = track.status === 'active'
  const projectHref = `/${orgSlug}/pro/${project._id}`

  return (
    <PageHeader
      className={className}
      icon={<RiRouteLine />}
      title={
        <span className="inline-flex min-w-0 max-w-full items-center gap-2">
          <Link
            href={projectHref}
            className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
          >
            {project.name}
          </Link>
          <RiArrowRightSLine className="size-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 truncate text-foreground">{track.name}</span>
        </span>
      }
      description={
        <span className="inline-flex min-w-0 max-w-full items-center gap-x-2 whitespace-nowrap">
          <span
            className={cn(
              'inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-px text-[11px] font-medium leading-none',
              isActive
                ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                : 'bg-muted text-muted-foreground',
            )}
          >
            <span
              className={cn(
                'size-1.5 shrink-0 rounded-full',
                isActive ? 'bg-green-500' : 'bg-muted-foreground',
              )}
            />
            {trackStatusLabels[track.status]}
          </span>
          <span className="shrink-0">
            {issueCount} {issueCount === 1 ? 'Issue' : 'Issues'}
          </span>
        </span>
      }
      actions={actions}
    />
  )
}
