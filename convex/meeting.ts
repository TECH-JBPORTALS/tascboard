import { v } from 'convex/values'
import { components } from './_generated/api'
import type { Doc, Id } from './_generated/dataModel'
import {
  internalMutation,
  type MutationCtx,
  type QueryCtx,
} from './_generated/server'
import {
  organizationMutation,
  organizationQuery,
} from './helpers/customFunctions'
import {
  createScheduleWithAttendees,
  generateSchedulesForMeeting,
} from './helpers/meetingScheduler'
import { vv } from './schema'

const DAYS_AHEAD = 14 /* Generate schedules for 14 days ahead by default */

async function getMeetingForOrg(
  ctx: QueryCtx | MutationCtx,
  meetingId: Id<'meeting'>,
  orgId: string,
) {
  const meeting = await ctx.db.get('meeting', meetingId)
  if (!meeting) throw new Error('Meeting not found')
  if (meeting.organizationId !== orgId) throw new Error('Unauthorized')
  return meeting
}

/**
 * Checks if the schedule meeting is associated with the organization.
 * Throw an error if the schedule meeting is not found or if it is not associated with the organization.
 * Return the schedule meeting and the meeting it is associated with.
 */
async function getScheduleForOrg(
  ctx: QueryCtx | MutationCtx,
  scheduleMeetingId: Id<'scheduleMeeting'>,
  orgId: string,
) {
  const schedule = await ctx.db.get('scheduleMeeting', scheduleMeetingId)
  if (!schedule) throw new Error('Scheduled meeting not found')
  const meeting = await getMeetingForOrg(ctx, schedule.meetingId, orgId)
  return { schedule, meeting }
}

/**
 * Checks if the user can manage the meeting.
 * Return true if the user is the creator of the meeting or if the user has the owner role.
 * @param meeting - The meeting object
 * @param userId - The ID of the user
 * @param role - The role of the user
 * @returns true if the user can manage the meeting, false otherwise
 */
function canManageMeeting(
  meeting: Doc<'meeting'>,
  userId: string,
  role: string,
) {
  return meeting.createdBy === userId || role === 'owner'
}

function isOwnerRole(role: string) {
  return role === 'owner'
}

function isInvitedToOccurrence(
  employeeId: string,
  attendeeEmployeeIds: string[],
  recipientEmployeeIds: string[],
) {
  return (
    attendeeEmployeeIds.includes(employeeId) ||
    recipientEmployeeIds.includes(employeeId)
  )
}

/**
 * Syncs the recipients of the meeting.
 * Delete any recipients that are not in the list.
 * Add any recipients that are in the list.
 * @param ctx - The context object
 * @param meetingId - The ID of the meeting
 * @param recipients - The list of recipients
 */
async function syncRecipients(
  ctx: MutationCtx,
  meetingId: Id<'meeting'>,
  recipients: string[],
) {
  const now = Date.now()
  const existing = await ctx.db
    .query('meetingRecipient')
    .withIndex('by_meeting', (q) => q.eq('meetingId', meetingId))
    .collect()

  const desired = new Set(recipients)
  const existingIds = new Set(existing.map((r) => r.employeeId))

  for (const recipient of existing) {
    if (!desired.has(recipient.employeeId)) {
      await ctx.db.delete('meetingRecipient', recipient._id)
    }
  }

  for (const employeeId of recipients) {
    if (!existingIds.has(employeeId)) {
      await ctx.db.insert('meetingRecipient', {
        meetingId,
        employeeId,
        createdAt: now,
        updatedAt: now,
      })
    }
  }
}

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
  returns: vv.id('meeting'),
  handler: async (ctx, args) => {
    const { userId, activeOrganizationId: orgId } = ctx.session

    if (!isOwnerRole(ctx.session.employee.role)) {
      throw new Error('Unauthorized')
    }

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

    await syncRecipients(ctx, meetingId, args.recipients)

    const meeting = await ctx.db.get('meeting', meetingId)
    if (!meeting) throw new Error('Meeting not found')

    await generateSchedulesForMeeting(ctx, meeting, DAYS_AHEAD)

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
    recipients: v.optional(v.array(v.string())),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { userId, activeOrganizationId: orgId } = ctx.session
    const meeting = await getMeetingForOrg(ctx, args.meetingId, orgId)

    if (!canManageMeeting(meeting, userId, ctx.session.employee.role)) {
      throw new Error('Unauthorized')
    }

    await ctx.db.patch('meeting', args.meetingId, {
      title: args.body.title ?? meeting.title,
      description: args.body.description ?? meeting.description,
      recurrenceType: args.body.recurrenceType ?? meeting.recurrenceType,
      recurrenceDays: args.body.recurrenceDays ?? meeting.recurrenceDays,
      startTime: args.body.startTime ?? meeting.startTime,
      endTime: args.body.endTime ?? meeting.endTime,
      meetingLink: args.body.meetingLink ?? meeting.meetingLink,
      updatedAt: Date.now(),
    })

    if (args.recipients !== undefined) {
      await syncRecipients(ctx, args.meetingId, args.recipients)
    }

    const updated = await ctx.db.get('meeting', args.meetingId)
    if (updated) {
      await generateSchedulesForMeeting(ctx, updated, DAYS_AHEAD)
    }

    return null
  },
})

export const list = organizationQuery({
  args: {},
  returns: v.array(vv.doc('meeting')),
  handler: async (ctx) => {
    const { activeOrganizationId: orgId } = ctx.session
    return await ctx.db
      .query('meeting')
      .withIndex('by_organization', (q) => q.eq('organizationId', orgId!))
      .order('desc')
      .collect()
  },
})

export const listWithUpcoming = organizationQuery({
  args: {},
  returns: v.array(
    v.object({
      meeting: vv.doc('meeting'),
      nextOccurrence: v.union(vv.doc('scheduleMeeting'), v.null()),
      recipientCount: v.number(),
    }),
  ),
  handler: async (ctx) => {
    const { activeOrganizationId: orgId } = ctx.session
    const now = Date.now()

    const meetings = await ctx.db
      .query('meeting')
      .withIndex('by_organization', (q) => q.eq('organizationId', orgId!))
      .order('desc')
      .collect()

    const results = await Promise.all(
      meetings.map(async (meeting) => {
        const schedules = await ctx.db
          .query('scheduleMeeting')
          .withIndex('by_meeting', (q) => q.eq('meetingId', meeting._id))
          .collect()

        const upcoming = schedules
          .filter((s) => s.endTime >= now)
          .sort((a, b) => a.startTime - b.startTime)

        const recipients = await ctx.db
          .query('meetingRecipient')
          .withIndex('by_meeting', (q) => q.eq('meetingId', meeting._id))
          .collect()

        return {
          meeting,
          nextOccurrence: upcoming[0] ?? null,
          recipientCount: recipients.length,
        }
      }),
    )

    return results
  },
})

const attendeePreviewValidator = v.object({
  employeeId: v.string(),
  name: v.string(),
  image: v.union(v.string(), v.null()),
})

export const listOccurrences = organizationQuery({
  args: {
    meetingId: v.optional(vv.id('meeting')),
  },
  returns: v.array(
    v.object({
      schedule: vv.doc('scheduleMeeting'),
      meeting: vv.doc('meeting'),
      attendeeCount: v.number(),
      attendees: v.array(attendeePreviewValidator),
    }),
  ),
  handler: async (ctx, args) => {
    const { activeOrganizationId: orgId, employee } = ctx.session
    const employeeId = employee._id
    const isOwner = isOwnerRole(employee.role)

    const employees = await ctx.runQuery(components.betterAuth.employees.list, {
      organizationId: orgId,
    })

    const employeeMap = new Map(
      employees.map((e) => [
        e._id,
        {
          name: e.user.name,
          image: e.user.image ?? null,
        },
      ]),
    )

    const resolveAttendees = (employeeIds: string[]) =>
      employeeIds.map((employeeId) => {
        const info = employeeMap.get(employeeId)
        return {
          employeeId,
          name: info?.name ?? 'Unknown',
          image: info?.image ?? null,
        }
      })

    const meetings = args.meetingId
      ? [await getMeetingForOrg(ctx, args.meetingId, orgId)]
      : await ctx.db
          .query('meeting')
          .withIndex('by_organization', (q) => q.eq('organizationId', orgId!))
          .collect()

    const occurrences: Array<{
      schedule: Doc<'scheduleMeeting'>
      meeting: Doc<'meeting'>
      attendeeCount: number
      attendees: Array<{
        employeeId: string
        name: string
        image: string | null
      }>
    }> = []

    for (const meeting of meetings) {
      const recipientDocs = await ctx.db
        .query('meetingRecipient')
        .withIndex('by_meeting', (q) => q.eq('meetingId', meeting._id))
        .collect()
      const recipientEmployeeIds = recipientDocs.map(
        (recipient) => recipient.employeeId,
      )

      const schedules = await ctx.db
        .query('scheduleMeeting')
        .withIndex('by_meeting', (q) => q.eq('meetingId', meeting._id))
        .collect()

      for (const schedule of schedules) {
        const attendeeDocs = await ctx.db
          .query('meetingAttendee')
          .withIndex('by_schedule', (q) =>
            q.eq('scheduleMeetingId', schedule._id),
          )
          .collect()

        const attendeeEmployeeIds = attendeeDocs.map(
          (attendee) => attendee.employeeId,
        )

        if (
          !isOwner &&
          !isInvitedToOccurrence(
            employeeId,
            attendeeEmployeeIds,
            recipientEmployeeIds,
          )
        ) {
          continue
        }

        const attendees = resolveAttendees(attendeeEmployeeIds)

        occurrences.push({
          schedule,
          meeting,
          attendeeCount: attendees.length,
          attendees,
        })
      }
    }

    return occurrences.sort(
      (a, b) => a.schedule.startTime - b.schedule.startTime,
    )
  },
})

export const get = organizationQuery({
  args: {
    meetingId: vv.id('meeting'),
  },
  returns: v.union(vv.doc('meeting'), v.null()),
  handler: async (ctx, args) => {
    const { activeOrganizationId: orgId } = ctx.session
    const meeting = await ctx.db.get('meeting', args.meetingId)
    if (!meeting) return null
    if (meeting.organizationId !== orgId) {
      return null
    }
    return meeting
  },
})

export const getScheduleDetail = organizationQuery({
  args: {
    scheduleMeetingId: vv.id('scheduleMeeting'),
  },
  returns: v.union(
    v.object({
      schedule: vv.doc('scheduleMeeting'),
      meeting: vv.doc('meeting'),
      attendees: v.array(
        v.object({
          _id: vv.id('meetingAttendee'),
          employeeId: v.string(),
          name: v.string(),
          email: v.string(),
          image: v.union(v.string(), v.null()),
        }),
      ),
      recipients: v.array(
        v.object({
          _id: vv.id('meetingRecipient'),
          employeeId: v.string(),
          name: v.string(),
          email: v.string(),
          image: v.union(v.string(), v.null()),
        }),
      ),
      canManage: v.boolean(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const { userId, activeOrganizationId: orgId } = ctx.session
    const schedule = await ctx.db.get('scheduleMeeting', args.scheduleMeetingId)
    if (!schedule) return null

    const meeting = await ctx.db.get('meeting', schedule.meetingId)
    if (!meeting || meeting.organizationId !== orgId) return null

    const employees = await ctx.runQuery(components.betterAuth.employees.list, {
      organizationId: orgId,
    })

    const employeeMap = new Map(
      employees.map((e) => [
        e._id,
        {
          name: e.user.name,
          email: e.user.email,
          image: e.user.image ?? null,
        },
      ]),
    )

    const attendeeDocs = await ctx.db
      .query('meetingAttendee')
      .withIndex('by_schedule', (q) =>
        q.eq('scheduleMeetingId', args.scheduleMeetingId),
      )
      .collect()

    const recipientDocs = await ctx.db
      .query('meetingRecipient')
      .withIndex('by_meeting', (q) => q.eq('meetingId', meeting._id))
      .collect()

    const employeeId = ctx.session.employee._id
    if (
      !isOwnerRole(ctx.session.employee.role) &&
      !isInvitedToOccurrence(
        employeeId,
        attendeeDocs.map((attendee) => attendee.employeeId),
        recipientDocs.map((recipient) => recipient.employeeId),
      )
    ) {
      return null
    }

    const resolveEmployee = (employeeId: string) => {
      const info = employeeMap.get(employeeId)
      return {
        name: info?.name ?? 'Unknown',
        email: info?.email ?? '',
        image: info?.image ?? null,
      }
    }

    return {
      schedule,
      meeting,
      attendees: attendeeDocs.map((a) => ({
        _id: a._id,
        employeeId: a.employeeId,
        ...resolveEmployee(a.employeeId),
      })),
      recipients: recipientDocs.map((r) => ({
        _id: r._id,
        employeeId: r.employeeId,
        ...resolveEmployee(r.employeeId),
      })),
      canManage: canManageMeeting(meeting, userId, ctx.session.employee.role),
    }
  },
})

export const remove = organizationMutation({
  args: {
    meetingId: vv.id('meeting'),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { userId, activeOrganizationId: orgId } = ctx.session
    const meeting = await getMeetingForOrg(ctx, args.meetingId, orgId)

    if (!canManageMeeting(meeting, userId, ctx.session.employee.role)) {
      throw new Error('Unauthorized')
    }

    const recipients = await ctx.db
      .query('meetingRecipient')
      .withIndex('by_meeting', (q) => q.eq('meetingId', args.meetingId))
      .collect()
    for (const recipient of recipients) {
      await ctx.db.delete('meetingRecipient', recipient._id)
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
        await ctx.db.delete('meetingAttendee', attendee._id)
      }
      await ctx.db.delete('scheduleMeeting', schedule._id)
    }
    await ctx.db.delete('meeting', args.meetingId)
    return null
  },
})

export const cancelSchedule = organizationMutation({
  args: {
    scheduleMeetingId: vv.id('scheduleMeeting'),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { userId, activeOrganizationId: orgId } = ctx.session
    const { schedule, meeting } = await getScheduleForOrg(
      ctx,
      args.scheduleMeetingId,
      orgId,
    )

    if (!canManageMeeting(meeting, userId, ctx.session.employee.role)) {
      throw new Error('Unauthorized')
    }

    const attendees = await ctx.db
      .query('meetingAttendee')
      .withIndex('by_schedule', (q) => q.eq('scheduleMeetingId', schedule._id))
      .collect()

    for (const attendee of attendees) {
      await ctx.db.delete('meetingAttendee', attendee._id)
    }
    await ctx.db.delete('scheduleMeeting', schedule._id)
    return null
  },
})

export const scheduleMeeting = organizationMutation({
  args: {
    meetingId: vv.id('meeting'),
    startTime: v.number(),
    endTime: v.number(),
    finalNotes: v.optional(v.string()),
  },
  returns: vv.id('scheduleMeeting'),
  handler: async (ctx, args) => {
    const { userId, activeOrganizationId: orgId } = ctx.session
    const meeting = await getMeetingForOrg(ctx, args.meetingId, orgId)

    if (!canManageMeeting(meeting, userId, ctx.session.employee.role)) {
      throw new Error('Unauthorized')
    }

    const scheduleId = await createScheduleWithAttendees(
      ctx,
      args.meetingId,
      args.startTime,
      args.endTime,
    )

    if (!scheduleId) {
      throw new Error('A schedule already exists for this time')
    }

    if (args.finalNotes) {
      await ctx.db.patch('scheduleMeeting', scheduleId, {
        finalNotes: args.finalNotes,
        updatedAt: Date.now(),
      })
    }

    return scheduleId
  },
})

export const inviteAttendees = organizationMutation({
  args: {
    scheduleMeetingId: vv.id('scheduleMeeting'),
    employeeIds: v.array(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { userId, activeOrganizationId: orgId } = ctx.session
    const { meeting } = await getScheduleForOrg(
      ctx,
      args.scheduleMeetingId,
      orgId,
    )

    if (!canManageMeeting(meeting, userId, ctx.session.employee.role)) {
      throw new Error('Unauthorized')
    }

    const existing = await ctx.db
      .query('meetingAttendee')
      .withIndex('by_schedule', (q) =>
        q.eq('scheduleMeetingId', args.scheduleMeetingId),
      )
      .collect()

    const existingIds = new Set(existing.map((a) => a.employeeId))
    const now = Date.now()

    await Promise.all(
      args.employeeIds
        .filter((id) => !existingIds.has(id))
        .map((employeeId) =>
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

export const sendMeetingReminders = internalMutation({
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

export const recordMeetingNotes = organizationMutation({
  args: {
    scheduleMeetingId: vv.id('scheduleMeeting'),
    finalNotes: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { userId, activeOrganizationId: orgId } = ctx.session
    const { meeting } = await getScheduleForOrg(
      ctx,
      args.scheduleMeetingId,
      orgId,
    )

    if (!canManageMeeting(meeting, userId, ctx.session.employee.role)) {
      throw new Error('Unauthorized')
    }

    await ctx.db.patch('scheduleMeeting', args.scheduleMeetingId, {
      finalNotes: args.finalNotes,
      updatedAt: Date.now(),
    })

    return null
  },
})

export const trackMeetingAttendance = organizationQuery({
  args: {
    scheduleMeetingId: vv.id('scheduleMeeting'),
  },
  returns: v.array(vv.doc('meetingAttendee')),
  handler: async (ctx, args) => {
    const { activeOrganizationId: orgId } = ctx.session
    await getScheduleForOrg(ctx, args.scheduleMeetingId, orgId)

    return await ctx.db
      .query('meetingAttendee')
      .withIndex('by_schedule', (q) =>
        q.eq('scheduleMeetingId', args.scheduleMeetingId),
      )
      .collect()
  },
})

export const getRecipients = organizationQuery({
  args: {
    meetingId: vv.id('meeting'),
  },
  returns: v.array(vv.doc('meetingRecipient')),
  handler: async (ctx, args) => {
    const { activeOrganizationId: orgId } = ctx.session
    await getMeetingForOrg(ctx, args.meetingId, orgId)

    return await ctx.db
      .query('meetingRecipient')
      .withIndex('by_meeting', (q) => q.eq('meetingId', args.meetingId))
      .collect()
  },
})

export const getSchedules = organizationQuery({
  args: {
    meetingId: vv.id('meeting'),
  },
  returns: v.array(vv.doc('scheduleMeeting')),
  handler: async (ctx, args) => {
    const { activeOrganizationId: orgId } = ctx.session
    await getMeetingForOrg(ctx, args.meetingId, orgId)

    const schedules = await ctx.db
      .query('scheduleMeeting')
      .withIndex('by_meeting', (q) => q.eq('meetingId', args.meetingId))
      .collect()

    return schedules.sort((a, b) => a.startTime - b.startTime)
  },
})
