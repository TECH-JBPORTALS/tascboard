import { defineTable } from 'convex/server'
import { v } from 'convex/values'

/** Shared across schema + mutations (import from this file or use `vv.doc('projects').fields.color`). */
export const projectColorValidator = v.union(
  v.literal('gray'),
  v.literal('purple'),
  v.literal('blue'),
  v.literal('teal'),
  v.literal('green'),
  v.literal('yellow'),
  v.literal('orange'),
  v.literal('red'),
)

export const projects = defineTable({
  organizationId: v.string(),
  name: v.string(),
  summary: v.optional(v.string()),
  description: v.optional(v.any()),
  icon: v.optional(v.string()),
  color: v.optional(projectColorValidator),
  startDate: v.number(),
  endDate: v.number(),
  status: v.union(
    v.literal('active'),
    v.literal('inactive'),
    v.literal('terminated'),
  ),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
}).index('by_organization', ['organizationId'])
