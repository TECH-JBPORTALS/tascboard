import {
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiTimeLine,
} from '@remixicon/react'
import { differenceInMilliseconds } from 'date-fns'
import type { AttendanceStatus } from '@/lib/attendance-types'
import { cn } from '@/lib/utils'
import {
  type DayWorkSchedule,
  isUnderScheduledHours,
} from '@/lib/work-schedule'
import { Badge } from '../ui/badge'
import {
  AttendanceTimeTicker,
  formatElapsedDuration,
} from './attendance-time-ticker'

export function AttendanceStatusBadge({
  status,
  isOnLeave,
  loginTime,
  logoutTime,
  workingSchedule,
}: {
  status?: AttendanceStatus | null
  loginTime?: number | null
  logoutTime?: number | null
  isOnLeave?: boolean
  workingSchedule?: DayWorkSchedule
}) {
  if (status === 'absent') {
    return (
      <Badge className="capitalize bg-destructive/20 text-destructive">
        <RiCloseCircleLine />
        Absent
      </Badge>
    )
  }

  if (isOnLeave || status === 'on leave') {
    return (
      <Badge className="capitalize bg-green-600/30 text-green-600">Leave</Badge>
    )
  }

  if (!loginTime) return null

  if (logoutTime) {
    const workedMs = differenceInMilliseconds(
      new Date(logoutTime),
      new Date(loginTime),
    )
    const underScheduled =
      workingSchedule &&
      isUnderScheduledHours(loginTime, logoutTime, workingSchedule)

    return (
      <Badge
        className={cn(
          'capitalize bg-green-600/20 text-green-600',
          underScheduled && 'bg-orange-600/20 text-orange-600',
        )}
      >
        <RiCheckboxCircleLine />
        {formatElapsedDuration(workedMs)}
      </Badge>
    )
  }

  if (loginTime) {
    return (
      <Badge
        variant={'secondary'}
        className="capitalize border border-green-500  text-green-600"
      >
        <RiTimeLine />
        <AttendanceTimeTicker showSeconds loginTime={loginTime} />
      </Badge>
    )
  }

  return null
}
