import { defineTable } from 'convex/server'
import { v } from 'convex/values'

export const payroll = defineTable({
  organizationId: v.string(),
  employeeId: v.string(),
  payPeriodStart: v.number(),
  payPeriodEnd: v.number(),
  basicSalary: v.float64(),
  deduction: v.float64(),
  overtimePay: v.float64(),
  bonus: v.float64(),
  netSalary: v.float64(),
  creditedAt: v.optional(v.number()),
  editedAt: v.optional(v.number()),
  notes: v.optional(v.string()),
  extensionFields: v.optional(v.record(v.string(), v.number())),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
})
  .index('by_org_and_period', ['organizationId', 'payPeriodStart'])
  .index('by_org_employee_period', [
    'organizationId',
    'employeeId',
    'payPeriodStart',
  ])
