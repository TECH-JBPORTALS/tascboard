import { describe, expect, test } from 'bun:test'

import {
  getLeaveDays,
  getUsedApprovedLeaves,
  splitLeaveDaysByYear,
  validateAdvanceNotice,
  validateRaiseAgainstQuota,
} from '../lib/leaveRequestHelpers'

describe('leaveRequest helpers', () => {
  test('getLeaveDays counts single day as one', () => {
    const day = new Date('2026-06-15T00:00:00.000Z').getTime()
    expect(getLeaveDays(day, day)).toBe(1)
  })

  test('getLeaveDays counts inclusive range', () => {
    const start = new Date('2026-06-15T00:00:00.000Z').getTime()
    const end = new Date('2026-06-17T00:00:00.000Z').getTime()
    expect(getLeaveDays(start, end)).toBe(3)
  })

  test('validateAdvanceNotice rejects same-day leave', () => {
    const now = new Date('2026-06-15T12:00:00.000Z').getTime()
    const today = new Date('2026-06-15T00:00:00.000Z').getTime()
    expect(() => validateAdvanceNotice(today, now)).toThrow(
      'Leave must be requested at least one day in advance',
    )
  })

  test('validateAdvanceNotice allows tomorrow', () => {
    const now = new Date('2026-06-15T12:00:00.000Z').getTime()
    const tomorrow = new Date('2026-06-16T00:00:00.000Z').getTime()
    expect(() => validateAdvanceNotice(tomorrow, now)).not.toThrow()
  })

  test('validateRaiseAgainstQuota rejects invalid range', () => {
    expect(() =>
      validateRaiseAgainstQuota({
        requests: [],
        startDate: 200,
        endDate: 100,
        quotasByYear: new Map([[2026, 15]]),
      }),
    ).toThrow('Invalid date range')
  })

  test('validateRaiseAgainstQuota rejects when quota exhausted', () => {
    const day = new Date('2026-06-15T00:00:00.000Z').getTime()
    const requests = Array.from({ length: 15 }, () => ({
      status: 'approved',
      startDate: day,
      endDate: day,
    }))

    expect(() =>
      validateRaiseAgainstQuota({
        requests,
        startDate: day,
        endDate: day,
        quotasByYear: new Map([[2026, 15]]),
      }),
    ).toThrow('No leave balance remaining for 2026')
  })

  test('validateRaiseAgainstQuota validates each year in cross-year range', () => {
    const dec31 = new Date('2026-12-31T00:00:00.000Z').getTime()
    const jan1 = new Date('2027-01-01T00:00:00.000Z').getTime()

    expect(() =>
      validateRaiseAgainstQuota({
        requests: [],
        startDate: dec31,
        endDate: jan1,
        quotasByYear: new Map([
          [2026, 1],
          [2027, 0],
        ]),
      }),
    ).toThrow('No leave balance remaining for 2027')
  })

  test('splitLeaveDaysByYear splits days across calendar years', () => {
    const dec31 = new Date('2026-12-31T00:00:00.000Z').getTime()
    const jan2 = new Date('2027-01-02T00:00:00.000Z').getTime()
    const split = splitLeaveDaysByYear(dec31, jan2)

    expect(split.get(2026)).toBe(1)
    expect(split.get(2027)).toBe(2)
  })

  test('getUsedApprovedLeaves ignores pending requests', () => {
    const day = new Date('2026-06-15T00:00:00.000Z').getTime()
    const used = getUsedApprovedLeaves([
      { status: 'pending', startDate: day, endDate: day },
      { status: 'approved', startDate: day, endDate: day },
    ])

    expect(used).toBe(1)
  })
})
