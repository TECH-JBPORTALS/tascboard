import { defineTable } from 'convex/server'
import { v } from 'convex/values'

export const dailyReport = defineTable({
  employeeId: v.string(),
  reportDate: v.number(),
  workSummary: v.string(),
  loginTime: v.string(),
  logoutTime: v.string(),
  reviewerId: v.string(),
  remark: v.string(),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
}).index('by_employee', ['employeeId'])
