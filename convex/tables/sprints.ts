import { defineTable } from 'convex/server'
import { v } from 'convex/values'

export const sprints = defineTable({
  trackId: v.id('tracks'),
  sprintNumber: v.number(),
  goal: v.string(),
  startDate: v.number(),
  endDate: v.number(),
  status: v.union(
    v.literal('planned'),
    v.literal('active'),
    v.literal('completed'),
  ),
  createdBy: v.string(),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
})
  .index('by_track', { fields: ['trackId'] })
  .index('by_track_status', ['trackId', 'status'])
