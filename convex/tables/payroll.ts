import { defineTable } from 'convex/server'
import { v } from 'convex/values'

export const payroll = defineTable({
  employeeId: v.string(),
  creditedAt: v.number(),
  basicSalary: v.float64(),
  deduction: v.float64(),
  overtimePay: v.float64(),
  bonus: v.float64(),
  netSalary: v.float64(),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
})
  .index('by_employee', ['employeeId'])
  .index('by_credited_at', ['creditedAt'])
