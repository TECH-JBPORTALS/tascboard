import { format } from 'date-fns'
import type { LeaveType } from '@/lib/attendance-types'

export const leaveTypeLabels: Record<LeaveType, string> = {
  sick: 'Sick',
  casual: 'Casual',
  emergency: 'Emergency',
}

export function formatLeaveDate(startDate: number, endDate: number) {
  const start = format(new Date(startDate), 'dd MMM yyyy')
  if (startDate === endDate) {
    return start
  }
  return `${start} – ${format(new Date(endDate), 'dd MMM yyyy')}`
}
