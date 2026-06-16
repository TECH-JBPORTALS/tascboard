import { defineTable } from 'convex/server'
import { v } from 'convex/values'

export const employeeCompensation = defineTable({
  organizationId: v.string(),
  employeeId: v.string(),
  monthlyBasicSalary: v.float64(),
  effectiveFrom: v.number(),
  effectiveTo: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
})
  .index('by_org_and_employee', ['organizationId', 'employeeId'])
  .index('by_org_employee_effective', [
    'organizationId',
    'employeeId',
    'effectiveFrom',
  ])
