import { startOfCalendarDay } from '@/lib/calendar-date'

export function formatTimeInputValue(timestamp: number): string {
  const date = new Date(timestamp)
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

export function applyTimeToDate(recordDate: number, timeValue: string): number {
  const [hours, minutes] = timeValue.split(':').map(Number)
  const date = new Date(startOfCalendarDay(recordDate))
  date.setHours(hours ?? 0, minutes ?? 0, 0, 0)
  return date.getTime()
}
