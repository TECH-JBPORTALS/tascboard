import { defineTable } from 'convex/server'
import { v } from 'convex/values'

export const leaveRequests = defineTable({
  employeeId: v.string(),
  leaveType: v.union(
    v.literal('sick'),
    v.literal('casual'),
    v.literal('emergency'),
  ),
  startDate: v.number(),
  endDate: v.number(),
  reason: v.string(),
  rejectionReason: v.optional(v.string()),
  status: v.union(
    v.literal('pending'),
    v.literal('approved'),
    v.literal('rejected'),
  ),
  approvedBy: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
})
  .index('by_employee', ['employeeId'])
  .index('by_status', ['status'])
  .index('by_approved_by', ['approvedBy'])
