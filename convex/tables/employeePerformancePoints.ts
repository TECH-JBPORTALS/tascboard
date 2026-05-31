import { defineTable } from 'convex/server'
import { v } from 'convex/values'

export const employeePerformancePoints = defineTable({
  employeeId: v.string(),
  taskId: v.id('tasks'),
  points: v.number(),
  awardedBy: v.string(),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
})
  .index('by_employee', ['employeeId'])
  .index('by_task', ['taskId'])
