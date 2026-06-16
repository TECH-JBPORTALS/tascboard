import { defineTable } from 'convex/server'
import { v } from 'convex/values'

export const attendance = defineTable({
  employeeId: v.string(),
  recordDate: v.number(),
  loginTime: v.number(),
  logoutTime: v.optional(v.number()),
  status: v.union(
    v.literal('present'),
    v.literal('on leave'),
    v.literal('late'),
    v.literal('half day'),
    v.literal('absent'),
  ),
  remarks: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
})
  .index('by_employee_and_date', ['employeeId', 'recordDate'])
  .index('by_employee', ['employeeId'])
