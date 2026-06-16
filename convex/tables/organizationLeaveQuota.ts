import { defineTable } from 'convex/server'
import { v } from 'convex/values'

export const organizationLeaveQuota = defineTable({
  organizationId: v.string(),
  year: v.number(),
  paidLeaves: v.number(),
}).index('by_organization_and_year', ['organizationId', 'year'])
