/** Calendar-day helpers using local date components (avoids client/server TZ drift). */

export function toCalendarDateKey(date: Date | number): string {
  const d = typeof date === 'number' ? new Date(date) : date
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function startOfCalendarDay(date: Date | number): number {
  const d = typeof date === 'number' ? new Date(date) : date
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())
}

export function endOfCalendarDay(date: Date | number): number {
  const d = typeof date === 'number' ? new Date(date) : date
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate() + 1)
}

export function calendarDayFromKey(key: string): number {
  const [year, month, day] = key.split('-').map(Number)
  return Date.UTC(year!, month! - 1, day!)
}
