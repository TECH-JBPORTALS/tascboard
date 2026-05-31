import { defineTable } from 'convex/server'
import { v } from 'convex/values'

export const projectMember = defineTable({
  projectId: v.id('projects'),
  employeeId: v.string(),
  manager: v.boolean(),
  assignedBy: v.string(),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
})
  .index('by_project', ['projectId'])
  .index('by_project_employee', ['projectId', 'employeeId'])
  .index('by_project_manager', ['projectId', 'manager'])
  .index('by_employee', ['employeeId'])
