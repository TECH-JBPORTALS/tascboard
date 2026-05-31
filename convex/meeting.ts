import { v } from 'convex/values'
import {
  organizationMutation,
  organizationQuery,
  privateInternalMutation,
  privateMutation,
  privateQuery,
} from './lib/customFunctions'
import { vv } from './schema'

export const create = organizationMutation({
  args: vv
    .doc('meeting')
    .omit(
      '_id',
      '_creationTime',
      'organizationId',
      'createdBy',
      'createdAt',
      'updatedAt',
    )
    .extend({
      recipients: v.array(v.string()),
    }),
  handler: async (ctx, args) => {
    const { userId, activeOrganizationId: orgId } = ctx.session
    const now = Date.now()
    const meetingId = await ctx.db.insert('meeting', {
      organizationId: orgId,
      createdBy: userId,
      title: args.title,
      description: args.description,
      recurrenceType: args.recurrenceType,
      recurrenceDays: args.recurrenceDays,
      startTime: args.startTime,
      endTime: args.endTime,
      meetingLink: args.meetingLink,
      createdAt: now,
    })
    await Promise.all(
      args.recipients.map((employeeId) =>
        ctx.db.insert('meetingRecipient', {
          meetingId,
          employeeId,
          createdAt: now,
          updatedAt: now,
        }),
      ),
    )
    return meetingId
  },
})
export const update = organizationMutation({
  args: {
    meetingId: vv.id('meeting'),
    body: vv
      .doc('meeting')
      .omit(
        '_id',
        '_creationTime',
        'organizationId',
        'createdBy',
        'createdAt',
        'updatedAt',
      )
      .partial(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { userId, activeOrganizationId: orgId } = ctx.session
    const meeting = await ctx.db.get(args.meetingId)

    if (!meeting) {
      throw new Error('Meeting not found')
    }

    if (meeting.organizationId !== orgId) {
      throw new Error('Unauthorized')
    }

    if (meeting.createdBy !== userId) {
      throw new Error('Unauthorized')
    }

    await ctx.db.patch(args.meetingId, {
      title: args.body.title ?? meeting.title,
      description: args.body.description ?? meeting.description,
      recurrenceType: args.body.recurrenceType ?? meeting.recurrenceType,
      recurrenceDays: args.body.recurrenceDays ?? meeting.recurrenceDays,
      startTime: args.body.startTime ?? meeting.startTime,
      endTime: args.body.endTime ?? meeting.endTime,
      meetingLink: args.body.meetingLink ?? meeting.meetingLink,
      updatedAt: Date.now(),
    })
    return null
  },
})

export const list = organizationQuery({
  args: {},
  handler: async (ctx) => {
    const { activeOrganizationId: orgId } = ctx.session
    return await ctx.db
      .query('meeting')
      .withIndex('by_organization', (q) => q.eq('organizationId', orgId!))
      .order('desc')
      .collect()
  },
})

export const get = organizationQuery({
  args: {
    meetingId: vv.id('meeting'),
  },
  handler: async (ctx, args) => {
    const { activeOrganizationId: orgId } = ctx.session
    const meeting = await ctx.db.get(args.meetingId)
    if (!meeting) return null
    if (meeting.organizationId !== orgId) {
      return null
    }
    return meeting
  },
})

export const remove = organizationMutation({
  args: {
    meetingId: vv.id('meeting'),
  },
  handler: async (ctx, args) => {
    const { userId, activeOrganizationId: orgId } = ctx.session
    const meeting = await ctx.db.get(args.meetingId)
    if (!meeting) {
      throw new Error('Meeting not found')
    }
    if (meeting.organizationId !== orgId) {
      throw new Error('Unauthorized')
    }
    if (meeting.createdBy !== userId) {
      throw new Error('Unauthorized')
    }
    const recipients = await ctx.db
      .query('meetingRecipient')
      .withIndex('by_meeting', (q) => q.eq('meetingId', args.meetingId))
      .collect()
    for (const recipient of recipients) {
      await ctx.db.delete(recipient._id)
    }
    const schedules = await ctx.db
      .query('scheduleMeeting')
      .withIndex('by_meeting', (q) => q.eq('meetingId', args.meetingId))
      .collect()
    for (const schedule of schedules) {
      const attendees = await ctx.db
        .query('meetingAttendee')
        .withIndex('by_schedule', (q) =>
          q.eq('scheduleMeetingId', schedule._id),
        )
        .collect()

      for (const attendee of attendees) {
        await ctx.db.delete(attendee._id)
      }
      await ctx.db.delete(schedule._id)
    }
    await ctx.db.delete(args.meetingId)
    return null
  },
})

export const scheduleMeeting = privateMutation({
  args: {
    meetingId: vv.id('meeting'),
    startTime: v.number(),
    endTime: v.number(),
    finalNotes: v.optional(v.string()),
  },
  returns: vv.id('scheduleMeeting'),
  handler: async (ctx, args) => {
    const meeting = await ctx.db.get(args.meetingId)
    if (!meeting) {
      throw new Error('Meeting not found')
    }
    const now = Date.now()
    const scheduleId = await ctx.db.insert('scheduleMeeting', {
      meetingId: args.meetingId,
      startTime: args.startTime,
      endTime: args.endTime,
      finalNotes: args.finalNotes ?? '',
      createdAt: now,
      updatedAt: now,
    })
    return scheduleId
  },
})

export const inviteAttendees = privateMutation({
  args: {
    scheduleMeetingId: vv.id('scheduleMeeting'),
    employeeIds: v.array(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now()
    await Promise.all(
      args.employeeIds.map((employeeId) =>
        ctx.db.insert('meetingAttendee', {
          scheduleMeetingId: args.scheduleMeetingId,
          employeeId,
          createdAt: now,
          updatedAt: now,
        }),
      ),
    )
    return null
  },
})

export const sendMeetingReminders = privateInternalMutation({
  args: {
    scheduleMeetingId: vv.id('scheduleMeeting'),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const attendees = await ctx.db
      .query('meetingAttendee')
      .withIndex('by_schedule', (q) =>
        q.eq('scheduleMeetingId', args.scheduleMeetingId),
      )
      .collect()
    console.log(`Sending reminders to ${attendees.length} attendees`)
    return null
  },
})

export const recordMeetingNotes = privateMutation({
  args: {
    scheduleMeetingId: vv.id('scheduleMeeting'),
    finalNotes: v.string(),
  },

  returns: v.null(),

  handler: async (ctx, args) => {
    const schedule = await ctx.db.get(args.scheduleMeetingId)

    if (!schedule) {
      throw new Error('Scheduled meeting not found')
    }

    await ctx.db.patch(args.scheduleMeetingId, {
      finalNotes: args.finalNotes,
      updatedAt: Date.now(),
    })

    return null
  },
})

export const trackMeetingAttendance = privateQuery({
  args: {
    scheduleMeetingId: vv.id('scheduleMeeting'),
  },
  handler: async (ctx, args) => {
    const attendees = await ctx.db
      .query('meetingAttendee')
      .withIndex('by_schedule', (q) =>
        q.eq('scheduleMeetingId', args.scheduleMeetingId),
      )
      .collect()

    return attendees
  },
})

export const getRecipients = privateQuery({
  args: {
    meetingId: vv.id('meeting'),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('meetingRecipient')
      .withIndex('by_meeting', (q) => q.eq('meetingId', args.meetingId))
      .collect()
  },
})

export const getSchedules = privateQuery({
  args: {
    meetingId: vv.id('meeting'),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('scheduleMeeting')
      .withIndex('by_meeting', (q) => q.eq('meetingId', args.meetingId))
      .collect()
  },
})
