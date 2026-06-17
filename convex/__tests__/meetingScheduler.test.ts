import { describe, expect, test } from 'bun:test'
import { convexTest } from 'convex-test'

import { Id } from '../_generated/dataModel'
import {
  computeUpcomingOccurrences,
  createScheduleWithAttendees,
  generateSchedulesForMeeting,
} from '../lib/meetingScheduler'
import schema from '../schema'
import { modules } from './_modules.test'

describe('meetingScheduler', () => {
  test('computeUpcomingOccurrences for weekly meetings', () => {
    const monday = new Date('2026-06-15T10:00:00')
    const end = new Date('2026-06-15T11:00:00')

    const occurrences = computeUpcomingOccurrences(
      {
        _id: 'meeting-id' as Id<'meeting'>,
        _creationTime: 0,
        organizationId: 'org-1',
        createdBy: 'user-1',
        title: 'Weekly',
        recurrenceType: 'weekly',
        recurrenceDays: ['monday', 'wednesday'],
        startTime: monday.getTime(),
        endTime: end.getTime(),
        meetingLink: 'https://meet.test',
        createdAt: Date.now(),
      },
      14,
      monday.getTime(),
    )

    expect(occurrences.length).toBeGreaterThan(0)
    expect(
      occurrences.every(
        (occurrence) => occurrence.endTime - occurrence.startTime === 3600000,
      ),
    ).toBe(true)
  })

  test('createScheduleWithAttendees dedupes by start time', async () => {
    const t = convexTest(schema, modules)
    const startTime = Date.now() + 86400000
    const endTime = startTime + 3600000

    const meetingId = await t.run(async (ctx) => {
      const now = Date.now()
      const id = await ctx.db.insert('meeting', {
        organizationId: 'org-1',
        createdBy: 'user-1',
        title: 'Dedupe',
        recurrenceType: 'none',
        recurrenceDays: [],
        startTime,
        endTime,
        meetingLink: 'https://meet.test',
        createdAt: now,
      })

      await ctx.db.insert('meetingRecipient', {
        meetingId: id,
        employeeId: 'emp-1',
        createdAt: now,
        updatedAt: now,
      })

      return id
    })

    await t.run(async (ctx) => {
      const meeting = await ctx.db.get('meeting', meetingId)
      expect(meeting).not.toBeNull()

      const first = await createScheduleWithAttendees(
        ctx,
        meetingId,
        startTime,
        endTime,
      )
      const second = await createScheduleWithAttendees(
        ctx,
        meetingId,
        startTime,
        endTime,
      )

      expect(first).not.toBeNull()
      expect(second).toBeNull()

      const schedules = await ctx.db
        .query('scheduleMeeting')
        .withIndex('by_meeting', (q) => q.eq('meetingId', meetingId))
        .collect()

      expect(schedules.length).toBe(1)

      const attendees = await ctx.db
        .query('meetingAttendee')
        .withIndex('by_schedule', (q) =>
          q.eq('scheduleMeetingId', schedules[0]!._id),
        )
        .collect()

      expect(attendees.length).toBe(1)
      expect(attendees[0]?.employeeId).toBe('emp-1')
    })
  })

  test('generateSchedulesForMeeting creates one-off occurrence', async () => {
    const t = convexTest(schema, modules)
    const startTime = Date.now() + 86400000
    const endTime = startTime + 3600000

    const meetingId = await t.run(async (ctx) => {
      const now = Date.now()
      return await ctx.db.insert('meeting', {
        organizationId: 'org-1',
        createdBy: 'user-1',
        title: 'One-off',
        recurrenceType: 'none',
        recurrenceDays: [],
        startTime,
        endTime,
        meetingLink: 'https://meet.test',
        createdAt: now,
      })
    })

    const created = await t.run(async (ctx) => {
      const meeting = await ctx.db.get('meeting', meetingId)
      expect(meeting).not.toBeNull()
      return await generateSchedulesForMeeting(ctx, meeting!, 14)
    })

    expect(created).toBe(1)

    const schedules = await t.run(async (ctx) =>
      ctx.db
        .query('scheduleMeeting')
        .withIndex('by_meeting', (q) => q.eq('meetingId', meetingId))
        .collect(),
    )

    expect(schedules.length).toBe(1)
    expect(schedules[0]?.startTime).toBe(startTime)
  })
})
