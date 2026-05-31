import { defineTable } from 'convex/server'
import { v } from 'convex/values'

export const employeeTodos = defineTable({
  employeeId: v.string(),
  title: v.string(),
  description: v.optional(v.string()),
  priority: v.union(v.literal('low'), v.literal('medium'), v.literal('high')),
  isCompleted: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
})
  .index('by_employee', ['employeeId'])
  .index('by_employee_and_status', ['employeeId', 'isCompleted'])
