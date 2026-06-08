export type RecurrenceType = 'none' | 'daily' | 'weekly'

export type RecurrenceDay =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

export const RECURRENCE_LABELS: Record<RecurrenceType, string> = {
  none: 'No recurrence',
  daily: 'Daily',
  weekly: 'Weekly',
}

export const RECURRENCE_DAY_LABELS: Record<RecurrenceDay, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
}

export const ALL_DAYS: RecurrenceDay[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]

export interface MeetingFormValues {
  title: string
  description: string
  meetingLink: string
  recurrenceType: RecurrenceType
  recurrenceDays: RecurrenceDay[]
  startTime: number
  endTime: number
  recipients: string[]
}

export function defaultFormValues(): MeetingFormValues {
  const now = new Date()
  now.setSeconds(0, 0)
  const start = now.getTime()
  const end = new Date(start + 60 * 60 * 1000).getTime()
  return {
    title: '',
    description: '',
    meetingLink: '',
    recurrenceType: 'none',
    recurrenceDays: [],
    startTime: start,
    endTime: end,
    recipients: [],
  }
}

export type MeetingStatus = 'live' | 'upcoming' | 'completed'

export function getMeetingStatus(
  startTime: number,
  endTime: number,
): MeetingStatus {
  const now = Date.now()
  if (now >= startTime && now <= endTime) return 'live'
  if (now < startTime) return 'upcoming'
  return 'completed'
}

export const STATUS_CONFIG: Record<
  MeetingStatus,
  { label: string; className: string }
> = {
  live: {
    label: 'Live',
    className: 'bg-red-500/15 text-red-500 border-red-500/20',
  },
  upcoming: {
    label: 'Upcoming',
    className: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  },
  completed: {
    label: 'Completed',
    className: 'bg-muted text-muted-foreground border-border',
  },
}
