import { RiCheckboxCircleLine, RiTimeLine } from '@remixicon/react'
import { differenceInMilliseconds } from 'date-fns'
import { Badge } from '../ui/badge'
import {
  AttendanceTimeTicker,
  formatElapsedDuration,
} from './attendance-time-ticker'

export function AttendanceStatusBadge({
  isOnLeave,
  loginTime,
  logoutTime,
}: {
  loginTime: number
  logoutTime?: number | null
  isOnLeave?: boolean
}) {
  if (isOnLeave) {
    return (
      <Badge className="capitalize bg-green-600/30 text-green-600">Leave</Badge>
    )
  }

  if (logoutTime) {
    return (
      <Badge className="capitalize bg-green-600/20 text-green-600">
        <RiCheckboxCircleLine />
        {formatElapsedDuration(
          differenceInMilliseconds(new Date(logoutTime), new Date(loginTime)),
        )}
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
