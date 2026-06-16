import { describe, expect, test } from 'bun:test'
import { deriveStatusFromLogin } from '../lib/attendanceStatus'

const recordDate = new Date('2026-06-13T00:00:00').getTime()

const workingDaySchedule = {
  enabled: true,
  startTime: '09:00',
  endTime: '17:00',
}

const nonWorkingDaySchedule = {
  enabled: false,
  startTime: '09:00',
  endTime: '17:00',
}

function loginAt(hours: number, minutes: number): number {
  const date = new Date(recordDate)
  date.setHours(hours, minutes, 0, 0)
  return date.getTime()
}

describe('deriveStatusFromLogin', () => {
  test('returns present when login is on time', () => {
    expect(deriveStatusFromLogin(loginAt(9, 0), workingDaySchedule)).toBe(
      'present',
    )
  })

  test('returns present when login is before scheduled start', () => {
    expect(deriveStatusFromLogin(loginAt(8, 30), workingDaySchedule)).toBe(
      'present',
    )
  })

  test('returns late when login is after scheduled start', () => {
    expect(deriveStatusFromLogin(loginAt(9, 15), workingDaySchedule)).toBe(
      'late',
    )
  })

  test('returns present on non-working days', () => {
    expect(deriveStatusFromLogin(loginAt(11, 0), nonWorkingDaySchedule)).toBe(
      'present',
    )
  })
})
