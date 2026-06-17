import { format } from 'date-fns'

export function formatMeetingDateTime(startTime: number, endTime: number) {
  const sameDay =
    new Date(startTime).toDateString() === new Date(endTime).toDateString()

  if (sameDay) {
    return `${format(startTime, 'MMM d, yyyy · h:mm a')} – ${format(endTime, 'h:mm a')}`
  }

  return `${format(startTime, 'MMM d, yyyy · h:mm a')} – ${format(endTime, 'MMM d, yyyy · h:mm a')}`
}

export function toDatetimeLocalValue(timestamp: number): string {
  const d = new Date(timestamp)
  const offset = d.getTimezoneOffset()
  const local = new Date(d.getTime() - offset * 60 * 1000)
  return local.toISOString().slice(0, 16)
}

export function fromDatetimeLocalValue(value: string): number {
  return new Date(value).getTime()
}
