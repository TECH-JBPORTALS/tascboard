'use client'

import { cn } from '@/lib/utils'
import { getMeetingStatus, STATUS_CONFIG } from '@/lib/meeting-types'

interface MeetingStatusBadgeProps {
  startTime: number
  endTime: number
  className?: string
}

export function MeetingStatusBadge({
  startTime,
  endTime,
  className,
}: MeetingStatusBadgeProps) {
  const status = getMeetingStatus(startTime, endTime)
  const config = STATUS_CONFIG[status]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium',
        config.className,
        className,
      )}
    >
      {status === 'live' && (
        <span className='relative flex size-1.5'>
          <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75' />
          <span className='relative inline-flex size-1.5 rounded-full bg-red-500' />
        </span>
      )}
      {config.label}
    </span>
  )
}