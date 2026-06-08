'use client'

import * as React from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import type { Id } from '@/convex/_generated/dataModel'
import { MeetingCardItem } from './meeting-card-item'

export type MeetingItem = {
  _id: Id<'meeting'>
  title: string
  description?: string
  startTime: number
  endTime: number
  recurrenceType: string
  meetingLink: string
  createdBy: string
  createdAt: number
}

type Props = {
  meetings: MeetingItem[] | undefined
  search: string
}

export function MeetingListTable({ meetings, search }: Props) {
  const filtered = React.useMemo(() => {
    if (!meetings) return []
    const q = search.toLowerCase().trim()
    return q
      ? meetings.filter((m) => m.title.toLowerCase().includes(q))
      : meetings
  }, [meetings, search])

  if (meetings === undefined) {
    return (
      <div className="flex flex-col divide-y divide-border rounded-xl border border-border bg-card">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4">
            <div className="flex gap-1">
              {Array.from({ length: 3 }).map((_, j) => (
                <Skeleton key={j} className="size-7 rounded-full" />
              ))}
            </div>
            <Skeleton className="h-4 w-48" />
            <div className="ml-auto flex gap-8">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (filtered.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-border bg-card py-24">
        <p className="text-sm text-muted-foreground">
          {search
            ? 'No results found.'
            : 'No meetings yet. Schedule your first meeting.'}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col divide-y divide-border rounded-xl border border-border bg-card">
      {filtered.map((m) => (
        <MeetingCardItem key={m._id} meeting={m} />
      ))}
    </div>
  )
}
