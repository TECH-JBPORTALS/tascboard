import { defineTable } from 'convex/server'
import { v } from 'convex/values'

export const meetingRecipient = defineTable({
  meetingId: v.id('meeting'),
  employeeId: v.string(),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
}).index('by_meeting', ['meetingId'])
