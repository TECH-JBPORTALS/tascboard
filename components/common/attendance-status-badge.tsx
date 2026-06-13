import { RiAlertLine, RiCheckboxCircleLine, RiTimeLine } from '@remixicon/react'
import { differenceInMilliseconds } from 'date-fns'
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
  isOnLeave,
  loginTime,
  logoutTime,
  workingSchedule,
}: {
  loginTime: number
  logoutTime?: number | null
  isOnLeave?: boolean
  workingSchedule?: DayWorkSchedule
}) {
  if (isOnLeave) {
    return (
      <Badge className="capitalize bg-green-600/30 text-green-600">Leave</Badge>
    )
  }

  if (logoutTime) {
    const workedMs = differenceInMilliseconds(
      new Date(logoutTime),
      new Date(loginTime),
    )
    const underScheduled =
      workingSchedule &&
      isUnderScheduledHours(loginTime, logoutTime, workingSchedule)

    if (underScheduled) {
      return (
        <Badge className="capitalize bg-orange-600/30 text-orange-600">
          <RiAlertLine />
          {formatElapsedDuration(workedMs)}
        </Badge>
      )
    }

    return (
      <Badge className="capitalize bg-green-600/20 text-green-600">
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
