import { defineTable } from 'convex/server'
import { v } from 'convex/values'

export const trackMember = defineTable({
  trackId: v.id('tracks'),
  employeeId: v.string(),
  lead: v.boolean(),
  assignedAt: v.number(),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
})
  .index('by_track_employee', ['trackId', 'employeeId'])
  .index('by_track', ['trackId'])
  .index('by_employee', ['employeeId'])
