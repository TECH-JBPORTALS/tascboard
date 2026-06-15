import { describe, expect, test } from 'bun:test'
import {
  attendanceDateKey,
  DEFAULT_WORK_SCHEDULE,
  formatAttendedCount,
  formatAttendancePercentage,
  getElapsedWorkingDayKeysInMonth,
  scoreAttendanceForDays,
} from '../lib/attendanceSummary'
import { calendarDayFromKey } from '../lib/calendarDate'
import type { WorkSchedule } from '../lib/organizationWorkSchedule'

describe('attendanceSummary', () => {
  test('getElapsedWorkingDayKeysInMonth excludes disabled weekdays', () => {
    const schedule: WorkSchedule = {
      ...DEFAULT_WORK_SCHEDULE,
      friday: { enabled: false, startTime: '09:00', endTime: '17:00' },
    }

    const workingDayKeys = getElapsedWorkingDayKeysInMonth(
      schedule,
      calendarDayFromKey('2025-06-01'),
      calendarDayFromKey('2025-07-01'),
    )

    expect(
      workingDayKeys.every((key) => {
        const day = new Date(calendarDayFromKey(key)).getUTCDay()
        return day !== 5
      }),
    ).toBe(true)
    expect(workingDayKeys.length).toBeGreaterThan(0)
  })

  test('getElapsedWorkingDayKeysInMonth caps at today for current month', () => {
    const workingDayKeys = getElapsedWorkingDayKeysInMonth(
      DEFAULT_WORK_SCHEDULE,
      calendarDayFromKey('2025-06-01'),
      calendarDayFromKey('2025-06-10'),
    )

    expect(workingDayKeys.every((key) => key <= '2025-06-10')).toBe(true)
    expect(workingDayKeys).toContain('2025-06-10')
    expect(workingDayKeys).not.toContain('2025-06-11')
  })

  test('getElapsedWorkingDayKeysInMonth uses calendar month anchor from client', () => {
    const workingDayKeys = getElapsedWorkingDayKeysInMonth(
      DEFAULT_WORK_SCHEDULE,
      calendarDayFromKey('2026-06-01'),
      calendarDayFromKey('2026-06-15'),
    )

    expect(workingDayKeys.every((key) => key.startsWith('2026-06'))).toBe(true)
    expect(workingDayKeys[0]).toBe('2026-06-01')
  })

  test('scoreAttendanceForDays weights half day at 0.5', () => {
    const workingDayKeys = ['2025-06-02', '2025-06-03', '2025-06-04']

    const attendanceByDateKey = {
      '2025-06-02': { status: 'present' as const },
      '2025-06-03': { status: 'present' as const },
      '2025-06-04': { status: 'half day' as const },
    }

    const score = scoreAttendanceForDays(attendanceByDateKey, workingDayKeys)

    expect(score.attendedCount).toBe(2.5)
    expect(score.totalSessions).toBe(3)
    expect(score.percentage).toBeCloseTo(83.333, 2)
  })

  test('scoreAttendanceForDays ignores absent, on leave, and missing records', () => {
    const workingDayKeys = ['2025-06-02', '2025-06-03', '2025-06-04', '2025-06-05']

    const attendanceByDateKey = {
      '2025-06-02': { status: 'present' as const },
      '2025-06-03': { status: 'absent' as const },
      '2025-06-04': { status: 'on leave' as const },
    }

    const score = scoreAttendanceForDays(attendanceByDateKey, workingDayKeys)

    expect(score.attendedCount).toBe(1)
    expect(score.totalSessions).toBe(4)
    expect(score.percentage).toBe(25)
  })

  test('attendanceDateKey normalizes record timestamps to calendar day', () => {
    expect(attendanceDateKey(calendarDayFromKey('2026-06-09'))).toBe('2026-06-09')
    expect(attendanceDateKey(calendarDayFromKey('2026-06-09') + 60_000 * 60 * 10)).toBe(
      '2026-06-09',
    )
  })

  test('formatAttendedCount shows integer or one decimal', () => {
    expect(formatAttendedCount(3)).toBe('3')
    expect(formatAttendedCount(2.5)).toBe('2.5')
  })

  test('formatAttendancePercentage rounds to one decimal', () => {
    expect(formatAttendancePercentage(83.333)).toBe('83.3%')
    expect(formatAttendancePercentage(100)).toBe('100%')
  })
})
