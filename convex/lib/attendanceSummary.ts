import {
  calendarDayFromKey,
  startOfCalendarDay,
  toCalendarDateKey,
} from './calendarDate'
import {
  DEFAULT_WORK_SCHEDULE,
  getDaySchedule,
  type WorkSchedule,
} from './organizationWorkSchedule'

export type AttendanceStatusForSummary =
  | 'present'
  | 'on leave'
  | 'late'
  | 'half day'
  | 'absent'
  | null

export type MonthlyAttendanceScore = {
  attendedCount: number
  totalSessions: number
  percentage: number
}

function scoreForStatus(status: AttendanceStatusForSummary): number {
  if (status === 'present' || status === 'late') return 1
  if (status === 'half day') return 0.5
  return 0
}

function calendarMonthPrefix(monthDate: Date | number): string {
  const monthKey = toCalendarDateKey(startOfCalendarDay(monthDate))
  return monthKey.slice(0, 7)
}

function daysInCalendarMonth(monthPrefix: string): number {
  const [year, month] = monthPrefix.split('-').map(Number)
  return new Date(Date.UTC(year!, month!, 0)).getUTCDate()
}

export function getCalendarMonthRange(monthDate: Date | number): {
  start: number
  end: number
} {
  const monthPrefix = calendarMonthPrefix(monthDate)
  const lastDay = daysInCalendarMonth(monthPrefix)
  return {
    start: calendarDayFromKey(`${monthPrefix}-01`),
    end: calendarDayFromKey(
      `${monthPrefix}-${String(lastDay).padStart(2, '0')}`,
    ),
  }
}

export function getElapsedWorkingDayKeysInMonth(
  schedule: WorkSchedule,
  monthDate: Date | number,
  now: Date | number,
): string[] {
  const monthPrefix = calendarMonthPrefix(monthDate)
  const todayKey = toCalendarDateKey(startOfCalendarDay(now))
  const todayPrefix = todayKey.slice(0, 7)

  if (monthPrefix > todayPrefix) {
    return []
  }

  const isCurrentMonth = monthPrefix === todayPrefix
  const lastDay = daysInCalendarMonth(monthPrefix)
  const keys: string[] = []

  for (let day = 1; day <= lastDay; day++) {
    const key = `${monthPrefix}-${String(day).padStart(2, '0')}`
    const dayMs = calendarDayFromKey(key)

    if (!getDaySchedule(schedule, dayMs).enabled) continue
    if (isCurrentMonth && key > todayKey) continue

    keys.push(key)
  }

  return keys
}

/** @deprecated Use getElapsedWorkingDayKeysInMonth */
export function getElapsedWorkingDaysInMonth(
  schedule: WorkSchedule,
  monthDate: Date | number,
  now: Date | number = Date.now(),
): Date[] {
  return getElapsedWorkingDayKeysInMonth(schedule, monthDate, now).map(
    (key) => new Date(calendarDayFromKey(key)),
  )
}

export function scoreAttendanceForDays(
  attendanceByDateKey: Record<string, { status: AttendanceStatusForSummary }>,
  workingDayKeys: string[],
): MonthlyAttendanceScore {
  const totalSessions = workingDayKeys.length

  const attendedCount = workingDayKeys.reduce((sum, key) => {
    const cell = attendanceByDateKey[key]
    return sum + scoreForStatus(cell?.status ?? null)
  }, 0)

  const percentage =
    totalSessions > 0 ? (attendedCount / totalSessions) * 100 : 0

  return { attendedCount, totalSessions, percentage }
}

export function attendanceDateKey(recordDate: number): string {
  return toCalendarDateKey(startOfCalendarDay(recordDate))
}

export function formatAttendedCount(count: number): string {
  return Number.isInteger(count) ? String(count) : count.toFixed(1)
}

export function formatAttendancePercentage(percentage: number): string {
  return `${Math.round(percentage * 10) / 10}%`
}

export { DEFAULT_WORK_SCHEDULE }
