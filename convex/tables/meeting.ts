import { defineTable } from 'convex/server'
import { v } from 'convex/values'

export const meeting = defineTable({
  organizationId: v.string(),
  createdBy: v.string(),
  title: v.string(),
  description: v.optional(v.string()),
  recurrenceType: v.union(
    v.literal('none'),
    v.literal('daily'),
    v.literal('weekly'),
  ),
  recurrenceDays: v.array(
    v.union(
      v.literal('monday'),
      v.literal('tuesday'),
      v.literal('wednesday'),
      v.literal('thursday'),
      v.literal('friday'),
      v.literal('saturday'),
      v.literal('sunday'),
    ),
  ),
  startTime: v.number(),
  endTime: v.number(),
  meetingLink: v.string(),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
}).index('by_organization', ['organizationId'])
