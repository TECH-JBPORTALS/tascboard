'use client'

import { useQuery } from 'convex/react'
import { format } from 'date-fns'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import * as React from 'react'
import { UserAvatar } from '@/components/employees/user-avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/convex/_generated/api'
import { getMeetingStatus, STATUS_CONFIG } from '@/lib/meeting-types'
import type { MeetingItem } from './meeting-list-table'

type Props = {
  meeting: MeetingItem
}

export function MeetingCardItem({ meeting }: Props) {
  const { orgSlug } = useParams<{ orgSlug: string }>()
  const recipients = useQuery(api.meeting.getRecipients, { meetingId: meeting._id })
  const employees = useQuery(api.employees.list)

  const empMap = React.useMemo(() => {
    const m = new Map<string, { name: string; image: string | null }>()
    for (const e of employees ?? []) {
      const name = e.user?.name ?? e.user?.email ?? 'Unknown'
      const image = e.user?.image ?? null
      m.set(e.id, { name, image })
    }
    return m
  }, [employees])

  const shown = (recipients ?? []).slice(0, 4)
  const overflow = (recipients?.length ?? 0) - 4
  const status = getMeetingStatus(meeting.startTime, meeting.endTime)
  const statusConfig = STATUS_CONFIG[status]

  const statusDot =
    status === 'live'
      ? 'bg-red-500 animate-pulse'
      : status === 'upcoming'
        ? 'bg-blue-400'
        : 'bg-muted-foreground/40'

  const statusText =
    status === 'live'
      ? 'text-red-500'
      : status === 'upcoming'
        ? 'text-blue-400'
        : 'text-muted-foreground'

  return (
    <Link
      href={`/${orgSlug}/meetings/${meeting._id}`}
      className='group flex items-center gap-6 px-5 py-4 transition-colors hover:bg-muted/30 first:rounded-t-xl last:rounded-b-xl'
    >
      {/* LEFT — Title + avatars */}
      <div className='flex min-w-0 flex-1 flex-col gap-1.5'>
        <p className='truncate text-sm font-semibold leading-tight'>
          {meeting.title}
        </p>
        {recipients === undefined ? (
          <div className='flex gap-1'>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className='size-6 rounded-full' />
            ))}
          </div>
        ) : (
          <div className='flex items-center gap-1'>
            <span className='flex -space-x-1.5'>
              {shown.map((r) => {
                const e = empMap.get(r.employeeId)
                return (
                  <UserAvatar
                    key={r.employeeId}
                    name={e?.name ?? '?'}
                    imageUrl={e?.image}
                    className='size-6 ring-2 ring-card'
                  />
                )
              })}
            </span>
            {overflow > 0 && (
              <span className='ml-1 text-xs text-muted-foreground'>
                +{overflow}
              </span>
            )}
          </div>
        )}
      </div>

      {/* MIDDLE — Event date + status */}
      <div className='hidden w-56 shrink-0 flex-col gap-0.5 sm:flex'>
        <p className='text-xs font-medium text-muted-foreground'>Event date</p>
        <div className='flex items-center gap-1.5'>
          <span className={`size-1.5 rounded-full ${statusDot}`} />
          <span className={`text-xs font-medium ${statusText}`}>
            {statusConfig.label}
          </span>
          <span className='text-xs text-muted-foreground'>
            · {format(new Date(meeting.startTime), 'MMM d, yyyy')}
          </span>
        </div>
      </div>

      {/* EVENT TIME */}
      <div className='hidden w-44 shrink-0 flex-col gap-0.5 sm:flex'>
        <p className='text-xs font-medium text-muted-foreground'>Event time</p>
        <p className='text-xs text-muted-foreground'>
          {format(new Date(meeting.startTime), 'hh:mm a')} –{' '}
          {format(new Date(meeting.endTime), 'hh:mm a')}
        </p>
      </div>

      {/* CREATED AT */}
      <div className='hidden w-36 shrink-0 flex-col gap-0.5 sm:flex'>
        <p className='text-xs font-medium text-muted-foreground'>Created</p>
        <p className='text-xs text-muted-foreground'>
          {format(new Date(meeting.createdAt), 'MMM d, yyyy')}
        </p>
        <p className='text-xs text-muted-foreground'>
          {format(new Date(meeting.createdAt), 'hh:mm a')}
        </p>
      </div>
    </Link>
  )
}