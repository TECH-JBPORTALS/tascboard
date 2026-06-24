import z from 'zod'
import {
  isEndTimeAfterStartTime,
  isValidTimeInput,
  timeLabelToTimestamp,
  timestampToTimeLabel,
} from '@/lib/time-select'

export const meetingFormSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required'),
    description: z.string(),
    meetingLink: z.string().trim().min(1, 'Meeting link is required'),
    recurrenceType: z.enum(['none', 'daily', 'weekly']),
    recurrenceDays: z.array(
      z.enum([
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday',
      ]),
    ),
    startTime: z
      .string()
      .min(1, 'Start time is required')
      .refine(isValidTimeInput, { message: 'Enter a valid start time' }),
    endTime: z
      .string()
      .min(1, 'End time is required')
      .refine(isValidTimeInput, { message: 'Enter a valid end time' }),
    recipients: z.array(z.string()),
  })
  .refine((data) => isEndTimeAfterStartTime(data.startTime, data.endTime), {
    message: 'End time must be after start time',
    path: ['endTime'],
  })
  .refine(
    (data) =>
      data.recurrenceType !== 'weekly' || data.recurrenceDays.length > 0,
    {
      message: 'Select at least one day for weekly recurrence',
      path: ['recurrenceDays'],
    },
  )

export type MeetingFormInput = z.infer<typeof meetingFormSchema>

export function meetingTimesToTimestamps(
  startTime: string,
  endTime: string,
  referenceDate = new Date(),
) {
  const startTimestamp = timeLabelToTimestamp(startTime, referenceDate)
  const endTimestamp = timeLabelToTimestamp(endTime, referenceDate)

  if (startTimestamp === null || endTimestamp === null) {
    throw new Error('Invalid meeting time')
  }

  return { startTimestamp, endTimestamp }
}

export function timestampsToMeetingTimes(
  startTimestamp: number,
  endTimestamp: number,
) {
  return {
    startTime: timestampToTimeLabel(startTimestamp),
    endTime: timestampToTimeLabel(endTimestamp),
  }
}
