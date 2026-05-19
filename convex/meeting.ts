import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { requireIdentity, requireOrganization } from "./lib/auth";

const recurrenceTypeValidator = v.union(
  v.literal("none"),
  v.literal("daily"),
  v.literal("weekly"),
);

// ✅ UPDATED: single day → multiple days
const recurrenceDayValidator = v.union(
  v.literal("monday"),
  v.literal("tuesday"),
  v.literal("wednesday"),
  v.literal("thursday"),
  v.literal("friday"),
  v.literal("saturday"),
  v.literal("sunday"),
);

const recurrenceDaysValidator = v.array(recurrenceDayValidator);

const meetingReturn = v.object({
  _id: v.id("meeting"),
  _creationTime: v.number(),
  organizationId: v.string(),
  createdBy: v.string(),
  title: v.string(),
  description: v.optional(v.string()),
  recurrenceType: recurrenceTypeValidator,
  recurrenceDays: recurrenceDaysValidator, // ✅ updated
  startTime: v.number(),
  endTime: v.number(),
  meetingLink: v.string(),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
});

const scheduleMeetingReturn = v.object({
  _id: v.id("scheduleMeeting"),
  _creationTime: v.number(),
  meetingId: v.id("meeting"),
  startTime: v.number(),
  endTime: v.number(),
  finalNotes: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
});

const meetingAttendeeReturn = v.object({
  _id: v.id("meetingAttendee"),
  _creationTime: v.number(),
  scheduleMeetingId: v.id("scheduleMeeting"),
  employeeId: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
});

const meetingRecipientReturn = v.object({
  _id: v.id("meetingRecipient"),
  _creationTime: v.number(),
  meetingId: v.id("meeting"),
  employeeId: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    recurrenceType: recurrenceTypeValidator,
    recurrenceDays: recurrenceDaysValidator, // ✅ updated
    startTime: v.number(),
    endTime: v.number(),
    meetingLink: v.string(),
    recipients: v.array(v.string()),
  },

  returns: v.id("meeting"),

  handler: async (ctx, args) => {
    const { userId } = await requireIdentity(ctx);
    const { orgId } = await requireOrganization(ctx);

    const now = Date.now();

    const meetingId = await ctx.db.insert("meeting", {
      organizationId: orgId,
      createdBy: userId,
      title: args.title,
      description: args.description,
      recurrenceType: args.recurrenceType,
      recurrenceDays: args.recurrenceDays, // ✅ now array
      startTime: args.startTime,
      endTime: args.endTime,
      meetingLink: args.meetingLink,
      createdAt: now,
    });

    for (const employeeId of args.recipients) {
      await ctx.db.insert("meetingRecipient", {
        meetingId,
        employeeId,
        createdAt: now,
        updatedAt: now,
      });
    }

    return meetingId;
  },
});

export const update = mutation({
  args: {
    meetingId: v.id("meeting"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    recurrenceType: v.optional(recurrenceTypeValidator),
    recurrenceDays: v.optional(recurrenceDaysValidator), // ✅ updated
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
    meetingLink: v.optional(v.string()),
  },

  returns: v.null(),

  handler: async (ctx, args) => {
    const { orgId, userId } = await requireIdentity(ctx);

    const meeting = await ctx.db.get(args.meetingId);

    if (!meeting) {
      throw new Error("Meeting not found");
    }

    if (meeting.organizationId !== orgId) {
      throw new Error("Unauthorized");
    }

    if (meeting.createdBy !== userId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.meetingId, {
      title: args.title ?? meeting.title,
      description: args.description ?? meeting.description,
      recurrenceType: args.recurrenceType ?? meeting.recurrenceType,
      recurrenceDays: args.recurrenceDays ?? meeting.recurrenceDays,
      startTime: args.startTime ?? meeting.startTime,
      endTime: args.endTime ?? meeting.endTime,
      meetingLink: args.meetingLink ?? meeting.meetingLink,
      updatedAt: Date.now(),
    });

    return null;
  },
});

export const list = query({
  args: {},

  returns: v.array(meetingReturn),

  handler: async (ctx) => {
    const { orgId } = await requireOrganization(ctx);

    return await ctx.db
      .query("meeting")
      .filter((q) => q.eq(q.field("organizationId"), orgId))
      .order("desc")
      .collect();
  },
});

export const get = query({
  args: {
    meetingId: v.id("meeting"),
  },

  returns: v.union(meetingReturn, v.null()),

  handler: async (ctx, args) => {
    const { orgId } = await requireOrganization(ctx);

    const meeting = await ctx.db.get(args.meetingId);

    if (!meeting) return null;

    if (meeting.organizationId !== orgId) {
      return null;
    }

    return meeting;
  },
});

export const remove = mutation({
  args: {
    meetingId: v.id("meeting"),
  },

  returns: v.null(),

  handler: async (ctx, args) => {
    const { orgId, userId } = await requireIdentity(ctx);

    const meeting = await ctx.db.get(args.meetingId);

    if (!meeting) {
      throw new Error("Meeting not found");
    }

    if (meeting.organizationId !== orgId) {
      throw new Error("Unauthorized");
    }

    if (meeting.createdBy !== userId) {
      throw new Error("Unauthorized");
    }

    const recipients = await ctx.db
      .query("meetingRecipient")
      .filter((q) => q.eq(q.field("meetingId"), args.meetingId))
      .collect();

    for (const recipient of recipients) {
      await ctx.db.delete(recipient._id);
    }

    const schedules = await ctx.db
      .query("scheduleMeeting")
      .filter((q) => q.eq(q.field("meetingId"), args.meetingId))
      .collect();

    for (const schedule of schedules) {
      const attendees = await ctx.db
        .query("meetingAttendee")
        .filter((q) => q.eq(q.field("scheduleMeetingId"), schedule._id))
        .collect();

      for (const attendee of attendees) {
        await ctx.db.delete(attendee._id);
      }

      await ctx.db.delete(schedule._id);
    }

    await ctx.db.delete(args.meetingId);

    return null;
  },
});

export const scheduleMeeting = mutation({
  args: {
    meetingId: v.id("meeting"),
    startTime: v.number(),
    endTime: v.number(),
    finalNotes: v.optional(v.string()),
  },

  returns: v.id("scheduleMeeting"),

  handler: async (ctx, args) => {
    const meeting = await ctx.db.get(args.meetingId);

    if (!meeting) {
      throw new Error("Meeting not found");
    }

    const now = Date.now();

    const scheduleId = await ctx.db.insert("scheduleMeeting", {
      meetingId: args.meetingId,
      startTime: args.startTime,
      endTime: args.endTime,
      finalNotes: args.finalNotes ?? "",
      createdAt: now,
      updatedAt: now,
    });

    return scheduleId;
  },
});

export const inviteAttendees = mutation({
  args: {
    scheduleMeetingId: v.id("scheduleMeeting"),
    employeeIds: v.array(v.string()),
  },

  returns: v.null(),

  handler: async (ctx, args) => {
    const now = Date.now();

    for (const employeeId of args.employeeIds) {
      await ctx.db.insert("meetingAttendee", {
        scheduleMeetingId: args.scheduleMeetingId,
        employeeId,
        createdAt: now,
        updatedAt: now,
      });
    }

    return null;
  },
});

export const sendMeetingReminders = internalMutation({
  args: {
    scheduleMeetingId: v.id("scheduleMeeting"),
  },

  returns: v.null(),

  handler: async (ctx, args) => {
    const attendees = await ctx.db
      .query("meetingAttendee")
      .filter((q) => q.eq(q.field("scheduleMeetingId"), args.scheduleMeetingId))
      .collect();

    console.log(`Sending reminders to ${attendees.length} attendees`);

    return null;
  },
});

export const recordMeetingNotes = mutation({
  args: {
    scheduleMeetingId: v.id("scheduleMeeting"),
    finalNotes: v.string(),
  },

  returns: v.null(),

  handler: async (ctx, args) => {
    const schedule = await ctx.db.get(args.scheduleMeetingId);

    if (!schedule) {
      throw new Error("Scheduled meeting not found");
    }

    await ctx.db.patch(args.scheduleMeetingId, {
      finalNotes: args.finalNotes,
      updatedAt: Date.now(),
    });

    return null;
  },
});

export const trackMeetingAttendance = mutation({
  args: {
    scheduleMeetingId: v.id("scheduleMeeting"),
  },

  returns: v.array(meetingAttendeeReturn),

  handler: async (ctx, args) => {
    const attendees = await ctx.db
      .query("meetingAttendee")
      .filter((q) => q.eq(q.field("scheduleMeetingId"), args.scheduleMeetingId))
      .collect();

    return attendees;
  },
});

export const getRecipients = query({
  args: {
    meetingId: v.id("meeting"),
  },

  returns: v.array(meetingRecipientReturn),

  handler: async (ctx, args) => {
    return await ctx.db
      .query("meetingRecipient")
      .filter((q) => q.eq(q.field("meetingId"), args.meetingId))
      .collect();
  },
});

export const getSchedules = query({
  args: {
    meetingId: v.id("meeting"),
  },

  returns: v.array(scheduleMeetingReturn),

  handler: async (ctx, args) => {
    return await ctx.db
      .query("scheduleMeeting")
      .filter((q) => q.eq(q.field("meetingId"), args.meetingId))
      .collect();
  },
});