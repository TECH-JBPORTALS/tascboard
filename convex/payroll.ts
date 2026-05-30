import { v } from 'convex/values'
import {
  privateInternalMutation,
  privateMutation,
  privateQuery,
} from './lib/customFunctions'

export const create = privateInternalMutation({
  args: {
    employeeId: v.string(),
    creditedAt: v.number(),
    basicSalary: v.float64(),
    deduction: v.float64(),
    overtimePay: v.float64(),
    bonus: v.float64(),
    netSalary: v.float64(),
  },
  handler: async (ctx, args) => {
    const now = Date.now()

    const payrollId = await ctx.db.insert('payroll', {
      ...args,
      createdAt: now,
    })

    return payrollId
  },
})

export const list = privateQuery({
  args: {
    employeeId: v.string(),
  },
  handler: async (ctx, args) => {
    const records = await ctx.db
      .query('payroll')
      .withIndex('by_employee', (q) => q.eq('employeeId', args.employeeId))
      .collect()

    return records.sort((a, b) => b.creditedAt - a.creditedAt)
  },
})

export const listAll = privateQuery({
  args: {
    from: v.optional(v.number()),
    to: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const records = await ctx.db.query('payroll').collect()
    const filtered = records.filter((p) => {
      const afterFrom = args.from ? p.creditedAt >= args.from : true
      const beforeTo = args.to ? p.creditedAt <= args.to : true
      return afterFrom && beforeTo
    })
    return filtered.sort((a, b) => b.creditedAt - a.creditedAt)
  },
})

export const get = privateQuery({
  args: {
    id: v.id('payroll'),
  },
  handler: async (ctx, args) => {
    const record = await ctx.db.get(args.id)
    return record ?? null
  },
})

export const update = privateMutation({
  args: {
    id: v.id('payroll'),
    basicSalary: v.optional(v.float64()),
    deduction: v.optional(v.float64()),
    overtimePay: v.optional(v.float64()),
    bonus: v.optional(v.float64()),
    netSalary: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args

    const record = await ctx.db.get(id)
    if (!record) {
      throw new Error('Payroll record not found')
    }

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    })

    return null
  },
})

export const remove = privateMutation({
  args: {
    id: v.id('payroll'),
  },
  handler: async (ctx, args) => {
    const record = await ctx.db.get(args.id)
    if (!record) {
      throw new Error('Payroll record not found')
    }

    await ctx.db.delete(args.id)
    return null
  },
})

export const getSummary = privateQuery({
  args: {
    employeeId: v.string(),
  },
  handler: async (ctx, args) => {
    const records = await ctx.db
      .query('payroll')
      .withIndex('by_employee', (q) => q.eq('employeeId', args.employeeId))
      .collect()

    return records.reduce(
      (acc, p) => {
        acc.totalBasicSalary += p.basicSalary
        acc.totalDeduction += p.deduction
        acc.totalOvertimePay += p.overtimePay
        acc.totalBonus += p.bonus
        acc.totalNetSalary += p.netSalary
        return acc
      },
      {
        totalBasicSalary: 0,
        totalDeduction: 0,
        totalOvertimePay: 0,
        totalBonus: 0,
        totalNetSalary: 0,
      },
    )
  },
})
