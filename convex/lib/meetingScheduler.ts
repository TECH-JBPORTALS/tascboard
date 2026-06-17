import type { Doc } from '../_generated/dataModel'
import type { MutationCtx } from '../_generated/server'

export type RecurrenceDay =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

const INDEX_TO_DAY: RecurrenceDay[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
]

const MS_PER_DAY = 24 * 60 * 60 * 1000

function startOfLocalDay(timestamp: number): number {
  const d = new Date(timestamp)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

function applyTemplateTime(dayStart: number, templateStart: number): number {
  const template = new Date(templateStart)
  const d = new Date(dayStart)
  d.setHours(
    template.getHours(),
    template.getMinutes(),
    template.getSeconds(),
    template.getMilliseconds(),
  )
  return d.getTime()
}

export function computeUpcomingOccurrences(
  meeting: Doc<'meeting'>,
  daysAhead: number,
  now = Date.now(),
): Array<{ startTime: number; endTime: number }> {
  const duration = meeting.endTime - meeting.startTime
  const windowStart = now
  const windowEnd = now + daysAhead * MS_PER_DAY
  const occurrences: Array<{ startTime: number; endTime: number }> = []

  if (meeting.recurrenceType === 'none') {
    if (meeting.startTime >= windowStart && meeting.startTime <= windowEnd) {
      occurrences.push({
        startTime: meeting.startTime,
        endTime: meeting.endTime,
      })
    }
    return occurrences
  }

  let dayStart = startOfLocalDay(windowStart)
  const lastDay = startOfLocalDay(windowEnd)

  while (dayStart <= lastDay) {
    const dayIndex = new Date(dayStart).getDay()
    const dayName = INDEX_TO_DAY[dayIndex]!

    let include = false
    if (meeting.recurrenceType === 'daily') {
      include = true
    } else if (meeting.recurrenceType === 'weekly') {
      include = meeting.recurrenceDays.includes(dayName)
    }

    if (include) {
      const startTime = applyTemplateTime(dayStart, meeting.startTime)
      if (startTime >= windowStart && startTime <= windowEnd) {
        occurrences.push({ startTime, endTime: startTime + duration })
      }
    }

    dayStart += MS_PER_DAY
  }

  return occurrences
}

export async function createScheduleWithAttendees(
  ctx: MutationCtx,
  meetingId: Doc<'meeting'>['_id'],
  startTime: number,
  endTime: number,
): Promise<Doc<'scheduleMeeting'>['_id'] | null> {
  const existingSchedules = await ctx.db
    .query('scheduleMeeting')
    .withIndex('by_meeting', (q) => q.eq('meetingId', meetingId))
    .collect()

  if (existingSchedules.some((s) => s.startTime === startTime)) {
    return null
  }

  const now = Date.now()
  const scheduleId = await ctx.db.insert('scheduleMeeting', {
    meetingId,
    startTime,
    endTime,
    finalNotes: '',
    createdAt: now,
    updatedAt: now,
  })

  const recipients = await ctx.db
    .query('meetingRecipient')
    .withIndex('by_meeting', (q) => q.eq('meetingId', meetingId))
    .collect()

  const existingAttendeeIds = new Set<string>()
  await Promise.all(
    recipients.map(async (recipient) => {
      if (existingAttendeeIds.has(recipient.employeeId)) return
      existingAttendeeIds.add(recipient.employeeId)
      await ctx.db.insert('meetingAttendee', {
        scheduleMeetingId: scheduleId,
        employeeId: recipient.employeeId,
        createdAt: now,
        updatedAt: now,
      })
    }),
  )

  return scheduleId
}

export async function generateSchedulesForMeeting(
  ctx: MutationCtx,
  meeting: Doc<'meeting'>,
  daysAhead: number,
): Promise<number> {
  const occurrences = computeUpcomingOccurrences(meeting, daysAhead)
  let created = 0

  for (const occurrence of occurrences) {
    const scheduleId = await createScheduleWithAttendees(
      ctx,
      meeting._id,
      occurrence.startTime,
      occurrence.endTime,
    )
    if (scheduleId) created += 1
  }

  return created
}
