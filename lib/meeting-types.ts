import type { Doc, Id } from '@/convex/_generated/dataModel'

export type MeetingRow = Doc<'meeting'>

export type ScheduleRow = Doc<'scheduleMeeting'>

export type RecurrenceDay =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

export type RecurrenceType = 'none' | 'daily' | 'weekly'

export interface AttendeeEmployee {
  id: string
  name: string
  email: string
  image: string | null
  role: string
}

export interface MeetingFormValues {
  title: string
  description: string
  meetingLink: string
  startTime: number
  endTime: number
  recurrenceType: RecurrenceType
  recurrenceDays: RecurrenceDay[]
  recipients: string[]
}

export const RECURRENCE_DAYS: RecurrenceDay[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]

export const RECURRENCE_LABELS: Record<RecurrenceType, string> = {
  none: 'No recurrence',
  daily: 'Daily',
  weekly: 'Weekly',
}