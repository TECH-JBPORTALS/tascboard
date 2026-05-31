import { defineTable } from 'convex/server'
import { v } from 'convex/values'

export const scheduleMeeting = defineTable({
  meetingId: v.id('meeting'),
  startTime: v.number(),
  endTime: v.number(),
  finalNotes: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
}).index('by_meeting', ['meetingId'])
