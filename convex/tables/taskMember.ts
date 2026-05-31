import { defineTable } from 'convex/server'
import { v } from 'convex/values'

export const taskMember = defineTable({
  taskId: v.id('tasks'),
  employeeId: v.string(),
  lead: v.boolean(),
  assignedAt: v.number(),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
})
  .index('by_task', ['taskId'])
  .index('by_employee', ['employeeId'])
  .index('by_task_employee', ['taskId', 'employeeId'])
