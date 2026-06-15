import { describe, expect, test } from 'bun:test'
import {
  endOfCalendarDay,
  startOfCalendarDay,
  toCalendarDateKey,
} from '../../lib/calendar-date'

describe('calendar-date', () => {
  test('toCalendarDateKey uses local date components', () => {
    const monday = new Date(2025, 5, 9, 15, 30, 0)
    expect(toCalendarDateKey(monday)).toBe('2025-06-09')
  })

  test('startOfCalendarDay matches between client-style dates', () => {
    const monday = new Date(2025, 5, 9, 0, 0, 0)
    const saturday = new Date(2025, 5, 14, 23, 59, 59)

    expect(startOfCalendarDay(monday)).toBe(Date.UTC(2025, 5, 9))
    expect(startOfCalendarDay(saturday)).toBe(Date.UTC(2025, 5, 14))
    expect(endOfCalendarDay(saturday)).toBe(Date.UTC(2025, 5, 15))
  })
})
