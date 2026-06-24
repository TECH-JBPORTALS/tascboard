import { beforeEach, describe, expect, test } from 'bun:test'
import { convexTest, TestConvexForDataModel } from 'convex-test'

import { api, internal } from '../_generated/api'
import { DataModel } from '../_generated/dataModel'
import schema from '../schema'
import { modules } from './_modules.test'

describe('Meeting', () => {
  let t: TestConvexForDataModel<DataModel>

  beforeEach(() => {
    t = convexTest(schema, modules).withIdentity({
      userId: 'user-1',
      orgId: 'org-1',
    })
  })

  test('create meeting', async () => {
    const meetingId = await t.mutation(api.meeting.create, {
      title: 'Sprint Planning',
      description: 'Weekly sprint planning meeting',
      recurrenceType: 'weekly',
      recurrenceDays: ['monday'],
      startTime: Date.now(),
      endTime: Date.now() + 3600000,
      meetingLink: 'https://meet.google.com/test',
      recipients: ['emp-1', 'emp-2'],
    })

    expect(meetingId).toBeDefined()

    const meeting = await t.query(api.meeting.get, {
      meetingId,
    })

    expect(meeting).not.toBeNull()
    expect(meeting?.title).toBe('Sprint Planning')
  })

  test('create one-off meeting auto-schedules first occurrence', async () => {
    const startTime = Date.now() + 86400000
    const endTime = startTime + 3600000

    const meetingId = await t.mutation(api.meeting.create, {
      title: 'One-off Sync',
      description: 'Single meeting',
      recurrenceType: 'none',
      recurrenceDays: [],
      startTime,
      endTime,
      meetingLink: 'https://meet.google.com/one-off',
      recipients: ['emp-1'],
    })

    const schedules = await t.query(api.meeting.getSchedules, { meetingId })
    expect(schedules.length).toBe(1)
    expect(schedules[0]?.startTime).toBe(startTime)
  })

  test('list meetings', async () => {
    await t.mutation(api.meeting.create, {
      title: 'Meeting 1',
      description: 'Description',
      recurrenceType: 'daily',
      recurrenceDays: ['monday'],
      startTime: Date.now(),
      endTime: Date.now() + 1000,
      meetingLink: 'https://meet.link/1',
      recipients: [],
    })

    await t.mutation(api.meeting.create, {
      title: 'Meeting 2',
      description: 'Description',
      recurrenceType: 'weekly',
      recurrenceDays: ['friday'],
      startTime: Date.now(),
      endTime: Date.now() + 1000,
      meetingLink: 'https://meet.link/2',
      recipients: [],
    })

    const meetings = await t.query(api.meeting.list)

    expect(meetings.length).toBe(2)
  })

  test('get meeting by id', async () => {
    const meetingId = await t.mutation(api.meeting.create, {
      title: 'Engineering Sync',
      description: 'Daily sync',
      recurrenceType: 'daily',
      recurrenceDays: ['tuesday'],
      startTime: Date.now(),
      endTime: Date.now() + 1000,
      meetingLink: 'https://meet.link/eng',
      recipients: [],
    })

    const meeting = await t.query(api.meeting.get, {
      meetingId,
    })

    expect(meeting).not.toBeNull()
    expect(meeting?.title).toBe('Engineering Sync')
  })

  test('update meeting', async () => {
    const meetingId = await t.mutation(api.meeting.create, {
      title: 'Old Meeting',
      description: 'Old description',
      recurrenceType: 'daily',
      recurrenceDays: ['wednesday'],
      startTime: Date.now(),
      endTime: Date.now() + 1000,
      meetingLink: 'https://meet.old',
      recipients: [],
    })

    await t.mutation(api.meeting.update, {
      meetingId,
      body: {
        title: 'Updated Meeting',
        description: 'Updated description',
      },
    })

    const updated = await t.query(api.meeting.get, {
      meetingId,
    })

    expect(updated?.title).toBe('Updated Meeting')
    expect(updated?.description).toBe('Updated description')
  })

  test('remove meeting', async () => {
    const meetingId = await t.mutation(api.meeting.create, {
      title: 'Delete Meeting',
      description: 'To be deleted',
      recurrenceType: 'none',
      recurrenceDays: [],
      startTime: Date.now(),
      endTime: Date.now() + 1000,
      meetingLink: 'https://meet.delete',
      recipients: [],
    })

    await t.mutation(api.meeting.remove, { meetingId })

    const meeting = await t.query(api.meeting.get, {
      meetingId,
    })

    expect(meeting).toBeNull()
  })

  test('schedule meeting', async () => {
    const meetingId = await t.mutation(api.meeting.create, {
      title: 'Schedule Test',
      description: 'Testing schedule',
      recurrenceType: 'weekly',
      recurrenceDays: ['friday'],
      startTime: Date.now(),
      endTime: Date.now() + 1000,
      meetingLink: 'https://meet.schedule',
      recipients: [],
    })

    const scheduleId = await t.mutation(api.meeting.scheduleMeeting, {
      meetingId,
      startTime: Date.now() + 7200000,
      endTime: Date.now() + 10800000,
      finalNotes: '',
    })

    expect(scheduleId).toBeDefined()

    const schedules = await t.query(api.meeting.getSchedules, {
      meetingId,
    })

    expect(schedules.length).toBeGreaterThan(0)
  })

  test('invite attendees', async () => {
    const meetingId = await t.mutation(api.meeting.create, {
      title: 'Invite Test',
      description: 'Invite attendees',
      recurrenceType: 'none',
      recurrenceDays: [],
      startTime: Date.now(),
      endTime: Date.now() + 1000,
      meetingLink: 'https://meet.invite',
      recipients: [],
    })

    const schedules = await t.query(api.meeting.getSchedules, { meetingId })
    const scheduleMeetingId = schedules[0]!._id

    await t.mutation(api.meeting.inviteAttendees, {
      scheduleMeetingId,
      employeeIds: ['emp-1', 'emp-2'],
    })

    const attendees = await t.query(api.meeting.trackMeetingAttendance, {
      scheduleMeetingId,
    })

    expect(attendees.length).toBe(2)
  })

  test('record meeting notes', async () => {
    const meetingId = await t.mutation(api.meeting.create, {
      title: 'Notes Meeting',
      description: 'Meeting notes',
      recurrenceType: 'none',
      recurrenceDays: [],
      startTime: Date.now(),
      endTime: Date.now() + 1000,
      meetingLink: 'https://meet.notes',
      recipients: [],
    })

    const schedules = await t.query(api.meeting.getSchedules, { meetingId })
    const scheduleMeetingId = schedules[0]!._id

    await t.mutation(api.meeting.recordMeetingNotes, {
      scheduleMeetingId,
      finalNotes: 'Discussed project roadmap',
    })

    const updatedSchedules = await t.query(api.meeting.getSchedules, {
      meetingId,
    })

    expect(updatedSchedules[0]?.finalNotes).toBe('Discussed project roadmap')
  })

  test('track meeting attendance', async () => {
    const meetingId = await t.mutation(api.meeting.create, {
      title: 'Attendance Meeting',
      description: 'Attendance tracking',
      recurrenceType: 'none',
      recurrenceDays: [],
      startTime: Date.now(),
      endTime: Date.now() + 1000,
      meetingLink: 'https://meet.attendance',
      recipients: ['emp-1', 'emp-2', 'emp-3'],
    })

    const schedules = await t.query(api.meeting.getSchedules, { meetingId })
    const scheduleMeetingId = schedules[0]!._id

    await t.mutation(api.meeting.inviteAttendees, {
      scheduleMeetingId,
      employeeIds: ['emp-4'],
    })

    const attendees = await t.query(api.meeting.trackMeetingAttendance, {
      scheduleMeetingId,
    })

    expect(attendees.length).toBe(4)
    expect(attendees[0]?.employeeId).toBeDefined()
  })

  test('get recipients', async () => {
    const meetingId = await t.mutation(api.meeting.create, {
      title: 'Recipients Meeting',
      description: 'Recipients test',
      recurrenceType: 'weekly',
      recurrenceDays: ['monday'],
      startTime: Date.now(),
      endTime: Date.now() + 1000,
      meetingLink: 'https://meet.recipients',
      recipients: ['emp-1', 'emp-2'],
    })

    const recipients = await t.query(api.meeting.getRecipients, {
      meetingId,
    })

    expect(recipients.length).toBe(2)
  })

  test('send meeting reminders', async () => {
    const meetingId = await t.mutation(api.meeting.create, {
      title: 'Reminder Meeting',
      description: 'Reminder test',
      recurrenceType: 'none',
      recurrenceDays: [],
      startTime: Date.now(),
      endTime: Date.now() + 1000,
      meetingLink: 'https://meet.reminder',
      recipients: [],
    })

    const schedules = await t.query(api.meeting.getSchedules, { meetingId })
    const scheduleMeetingId = schedules[0]!._id

    await expect(
      t.mutation(internal.meeting.sendMeetingReminders, {
        scheduleMeetingId,
      }),
    ).resolves.toBeNull()
  })

  test('scheduler dedupes occurrences', async () => {
    const startTime = Date.now() + 86400000
    const endTime = startTime + 3600000

    const meetingId = await t.mutation(api.meeting.create, {
      title: 'Dedupe Meeting',
      description: 'Dedupe test',
      recurrenceType: 'none',
      recurrenceDays: [],
      startTime,
      endTime,
      meetingLink: 'https://meet.dedupe',
      recipients: ['emp-1'],
    })

    await expect(
      t.mutation(api.meeting.scheduleMeeting, {
        meetingId,
        startTime,
        endTime,
      }),
    ).rejects.toThrow('A schedule already exists for this time')

    const result = await t.mutation(
      internal.meetingScheduler.generateRecurringSchedules,
      {},
    )

    expect(result.totalCreated).toBeGreaterThanOrEqual(0)

    const schedules = await t.query(api.meeting.getSchedules, { meetingId })
    expect(schedules.length).toBe(1)
  })

  test('non owner cannot update meeting', async () => {
    const meetingId = await t.mutation(api.meeting.create, {
      title: 'Protected Meeting',
      description: 'Unauthorized test',
      recurrenceType: 'daily',
      recurrenceDays: ['monday'],
      startTime: Date.now(),
      endTime: Date.now() + 1000,
      meetingLink: 'https://meet.protected',
      recipients: [],
    })

    const user2 = convexTest(schema, modules).withIdentity({
      userId: 'user-2',
      orgId: 'org-1',
    })

    await expect(
      user2.mutation(api.meeting.update, {
        meetingId,
        body: {
          title: 'Hacked',
        },
      }),
    ).rejects.toThrow()
  })

  test('non owner cannot delete meeting', async () => {
    const meetingId = await t.mutation(api.meeting.create, {
      title: 'Delete Protected',
      description: 'Unauthorized delete',
      recurrenceType: 'daily',
      recurrenceDays: ['friday'],
      startTime: Date.now(),
      endTime: Date.now() + 1000,
      meetingLink: 'https://meet.protected.delete',
      recipients: [],
    })

    const user2 = convexTest(schema, modules).withIdentity({
      userId: 'user-2',
      orgId: 'org-1',
    })

    await expect(
      user2.mutation(api.meeting.remove, { meetingId }),
    ).rejects.toThrow()
  })
})
