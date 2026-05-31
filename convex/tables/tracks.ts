import { defineTable } from 'convex/server'
import { v } from 'convex/values'

export const tracks = defineTable({
  name: v.string(),
  description: v.optional(v.string()),
  projectId: v.id('projects'),
  trackCode: v.string(),
  trackLeaderID: v.string(),
  status: v.union(
    v.literal('active'),
    v.literal('completed'),
    v.literal('archived'),
  ),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
}).index('by_project', { fields: ['projectId'] })
