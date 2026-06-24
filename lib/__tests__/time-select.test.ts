import { describe, expect, test } from 'bun:test'

import {
  formatMinutesTo12Hour,
  getTimeOptions,
  isEndTimeAfterStartTime,
  normalizeTimeInput,
  parseTimeInput,
  timeLabelToTimestamp,
  timestampToTimeLabel,
} from '../time-select'

describe('time-select', () => {
  test('generates 48 half-hour options', () => {
    expect(getTimeOptions()).toHaveLength(48)
    expect(getTimeOptions()[0]).toBe('12:00 AM')
    expect(getTimeOptions()[1]).toBe('12:30 AM')
  })

  test('parses common manual time formats', () => {
    expect(parseTimeInput('9:00 AM')).toBe(9 * 60)
    expect(parseTimeInput('9:00am')).toBe(9 * 60)
    expect(parseTimeInput('1:30 PM')).toBe(13 * 60 + 30)
    expect(parseTimeInput('12:00 AM')).toBe(0)
    expect(parseTimeInput('12:00 PM')).toBe(12 * 60)
  })

  test('normalizes typed values to canonical labels', () => {
    expect(normalizeTimeInput('1:30pm')).toBe('1:30 PM')
    expect(normalizeTimeInput('9 am')).toBe('9:00 AM')
  })

  test('compares start and end times', () => {
    expect(isEndTimeAfterStartTime('9:00 AM', '10:00 AM')).toBe(true)
    expect(isEndTimeAfterStartTime('10:00 AM', '9:00 AM')).toBe(false)
  })

  test('converts between timestamps and labels', () => {
    const date = new Date('2026-06-15T13:30:00')
    expect(timestampToTimeLabel(date.getTime())).toBe('1:30 PM')
    expect(timeLabelToTimestamp('1:30 PM', date)).toBe(date.getTime())
  })

  test('formats minutes to 12-hour labels', () => {
    expect(formatMinutesTo12Hour(0)).toBe('12:00 AM')
    expect(formatMinutesTo12Hour(13 * 60 + 30)).toBe('1:30 PM')
  })
})
