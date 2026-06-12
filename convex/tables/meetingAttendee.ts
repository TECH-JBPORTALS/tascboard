import { defineTable } from 'convex/server'
import { v } from 'convex/values'

export const meetingAttendee = defineTable({
  scheduleMeetingId: v.id('scheduleMeeting'),
  employeeId: v.string(),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
})
  .index('by_schedule', ['scheduleMeetingId'])
  .index('by_employee', ['employeeId'])
