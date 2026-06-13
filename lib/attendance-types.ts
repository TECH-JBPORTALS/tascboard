import type { Id } from '@/convex/_generated/dataModel'

export type AttendanceStatus =
  | 'present'
  | 'on leave'
  | 'late'
  | 'half day'
  | 'absent'
export type LeaveStatus = 'pending' | 'approved' | 'rejected'
export type LeaveType = 'sick' | 'casual' | 'emergency'
export type ActiveTab = 'daily' | 'monthly' | 'leave'

export type AttendanceRecord = {
  _id: Id<'attendance'>
  _creationTime: number
  employeeId: string
  recordDate: number
  loginTime: number
  logoutTime?: number
  status: AttendanceStatus
  createdAt: number
  updatedAt?: number
}

export type LeaveRequest = {
  _id: Id<'leaveRequests'>
  _creationTime: number
  employeeId: string
  leaveType: LeaveType
  startDate: number
  endDate: number
  reason: string
  status: LeaveStatus
  approvedBy?: string
  createdAt: number
  updatedAt?: number
}

export type EmployeeRef = {
  id: string
  name: string
  email: string
  image: string | null
  role: string
}

export type EnrichedAttendance = AttendanceRecord & {
  employee: EmployeeRef | undefined
}

export type EnrichedLeave = LeaveRequest & {
  employee: EmployeeRef | undefined
}

export type DailyRow = {
  employee: EmployeeRef
  onCreate: (
    employeeId: string,
    recordDate: number,
    status: AttendanceStatus,
  ) => Promise<void>
  onCheckOut: () => Promise<void>
  record: AttendanceRecord | undefined
  recordDate: number
}

export function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

export function getTotalHours(login: number, logout?: number): string {
  if (!logout) return '—'
  const h = Math.floor((logout - login) / 3_600_000)
  const m = Math.floor(((logout - login) % 3_600_000) / 60_000)
  return `${h}h ${m}m`
}

export function getStartOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

export function getEndOfDay(date: Date): number {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999,
  ).getTime()
}

export function getStartOfMonth(y: number, m: number): number {
  return new Date(y, m, 1).getTime()
}

export function getEndOfMonth(y: number, m: number): number {
  return new Date(y, m + 1, 0, 23, 59, 59, 999).getTime()
}

export function getWorkingDays(y: number, m: number): number {
  const days = new Date(y, m + 1, 0).getDate()
  let count = 0
  for (let d = 1; d <= days; d++) {
    const day = new Date(y, m, d).getDay()
    if (day !== 0 && day !== 6) count++
  }
  return count
}

export const STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: 'Present',
  late: 'Late',
  'on leave': 'On Leave',
  'half day': 'Half Day',
  absent: 'Absent',
}

export function getElapsedWorkingDays(y: number, m: number): number {
  const today = new Date()
  const isCurrentMonth = today.getFullYear() === y && today.getMonth() === m
  const lastDay = isCurrentMonth
    ? today.getDate()
    : new Date(y, m + 1, 0).getDate()
  let count = 0
  for (let d = 1; d <= lastDay; d++) {
    const day = new Date(y, m, d).getDay()
    if (day !== 0 && day !== 6) count++
  }
  return count
}
