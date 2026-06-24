import { v } from 'convex/values'
import { components } from './_generated/api'
import type { Doc } from './_generated/dataModel'
import type { MutationCtx, QueryCtx } from './_generated/server'
import { getActiveCompensationForEmployee } from './compensation'
import {
  organizationMutation,
  organizationQuery,
} from './helpers/customFunctions'
import {
  calculateNetSalary,
  getPayPeriodForMonth,
  getYearRange,
  isPaidPayroll,
} from './helpers/payrollHelpers'
import { vv } from './schema'

type OrganizationCtx = (QueryCtx | MutationCtx) & {
  session: {
    activeOrganizationId: string
    userId: string
    employee: { _id?: string; role: string }
  }
}

const employeeRefValidator = v.object({
  id: v.string(),
  name: v.string(),
  email: v.string(),
  image: v.union(v.string(), v.null()),
  role: v.string(),
})

const payrollDocValidator = vv.doc('payroll')

const payrollRowValidator = v.object({
  employee: employeeRefValidator,
  payroll: v.union(payrollDocValidator, v.null()),
  monthlyBasicSalary: v.union(v.number(), v.null()),
})

const payslipSummaryValidator = v.object({
  _id: vv.id('payroll'),
  payPeriodStart: v.number(),
  payPeriodEnd: v.number(),
  basicSalary: v.number(),
  deduction: v.number(),
  overtimePay: v.number(),
  bonus: v.number(),
  netSalary: v.number(),
  creditedAt: v.number(),
  editedAt: v.optional(v.number()),
})

function assertOwner(ctx: OrganizationCtx) {
  if (ctx.session.employee.role !== 'owner') {
    throw new Error('Only organization owners can perform this action')
  }
}

async function resolveCurrentEmployee(ctx: OrganizationCtx) {
  const employee = await ctx.runQuery(
    components.betterAuth.employees.getByOrganizationUser,
    {
      organizationId: ctx.session.activeOrganizationId,
      userId: ctx.session.userId,
    },
  )
  if (!employee) {
    throw new Error('Employee not found')
  }
  return employee
}

async function getPayrollForPeriod(
  ctx: QueryCtx,
  organizationId: string,
  employeeId: string,
  payPeriodStart: number,
): Promise<Doc<'payroll'> | null> {
  return await ctx.db
    .query('payroll')
    .withIndex('by_org_employee_period', (q) =>
      q
        .eq('organizationId', organizationId)
        .eq('employeeId', employeeId)
        .eq('payPeriodStart', payPeriodStart),
    )
    .unique()
}

export const listByMonth = organizationQuery({
  args: {
    month: v.number(),
  },
  returns: v.array(payrollRowValidator),
  handler: async (ctx, args) => {
    assertOwner(ctx)

    const organizationId = ctx.session.activeOrganizationId
    const { payPeriodStart } = getPayPeriodForMonth(args.month)

    const employees = await ctx.runQuery(components.betterAuth.employees.list, {
      organizationId,
      role: 'employee',
    })

    return Promise.all(
      employees.map(async (employee) => {
        const payroll = await getPayrollForPeriod(
          ctx,
          organizationId,
          employee._id,
          payPeriodStart,
        )
        const compensation = await getActiveCompensationForEmployee(
          ctx,
          organizationId,
          employee._id,
          payPeriodStart,
        )

        return {
          employee: {
            id: employee._id,
            name: employee.user.name,
            email: employee.user.email,
            image: employee.user.image ?? null,
            role: employee.role,
          },
          payroll,
          monthlyBasicSalary: compensation?.monthlyBasicSalary ?? null,
        }
      }),
    )
  },
})

export const listMineByYear = organizationQuery({
  args: {
    year: v.number(),
  },
  returns: v.array(payslipSummaryValidator),
  handler: async (ctx, args) => {
    const employee = await resolveCurrentEmployee(ctx)
    const organizationId = ctx.session.activeOrganizationId
    const { start, end } = getYearRange(args.year)

    const records = await ctx.db
      .query('payroll')
      .withIndex('by_org_employee_period', (q) =>
        q.eq('organizationId', organizationId).eq('employeeId', employee._id),
      )
      .collect()

    return records
      .filter(
        (record) =>
          isPaidPayroll(record.creditedAt) &&
          record.payPeriodStart >= start &&
          record.payPeriodStart <= end,
      )
      .sort((a, b) => b.payPeriodStart - a.payPeriodStart)
      .map((record) => ({
        _id: record._id,
        payPeriodStart: record.payPeriodStart,
        payPeriodEnd: record.payPeriodEnd,
        basicSalary: record.basicSalary,
        deduction: record.deduction,
        overtimePay: record.overtimePay,
        bonus: record.bonus,
        netSalary: record.netSalary,
        creditedAt: record.creditedAt!,
        editedAt: record.editedAt,
      }))
  },
})

export const getYearSummary = organizationQuery({
  args: {
    year: v.number(),
  },
  returns: v.object({
    totalBasicSalary: v.number(),
    totalDeduction: v.number(),
    totalOvertimePay: v.number(),
    totalBonus: v.number(),
    totalNetSalary: v.number(),
    paidMonths: v.number(),
  }),
  handler: async (ctx, args) => {
    const employee = await resolveCurrentEmployee(ctx)
    const organizationId = ctx.session.activeOrganizationId
    const { start, end } = getYearRange(args.year)

    const records = await ctx.db
      .query('payroll')
      .withIndex('by_org_employee_period', (q) =>
        q.eq('organizationId', organizationId).eq('employeeId', employee._id),
      )
      .collect()

    const paidRecords = records.filter(
      (record) =>
        isPaidPayroll(record.creditedAt) &&
        record.payPeriodStart >= start &&
        record.payPeriodStart <= end,
    )

    return paidRecords.reduce(
      (acc, record) => {
        acc.totalBasicSalary += record.basicSalary
        acc.totalDeduction += record.deduction
        acc.totalOvertimePay += record.overtimePay
        acc.totalBonus += record.bonus
        acc.totalNetSalary += record.netSalary
        acc.paidMonths += 1
        return acc
      },
      {
        totalBasicSalary: 0,
        totalDeduction: 0,
        totalOvertimePay: 0,
        totalBonus: 0,
        totalNetSalary: 0,
        paidMonths: 0,
      },
    )
  },
})

export const get = organizationQuery({
  args: {
    id: vv.id('payroll'),
  },
  returns: v.union(
    payrollDocValidator.extend({
      employee: employeeRefValidator,
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const record = await ctx.db.get(args.id)
    if (!record) return null

    if (record.organizationId !== ctx.session.activeOrganizationId) {
      throw new Error('Payroll record not found')
    }

    const isOwner = ctx.session.employee.role === 'owner'

    if (!isOwner) {
      const employee = await resolveCurrentEmployee(ctx)
      if (
        record.employeeId !== employee._id ||
        !isPaidPayroll(record.creditedAt)
      ) {
        throw new Error('Unauthorized')
      }
    }

    const employees = await ctx.runQuery(components.betterAuth.employees.list, {
      organizationId: ctx.session.activeOrganizationId,
    })
    const employeeDoc = employees.find((e) => e._id === record.employeeId)

    return {
      ...record,
      employee: {
        id: record.employeeId,
        name: employeeDoc?.user.name ?? 'Unknown',
        email: employeeDoc?.user.email ?? '',
        image: employeeDoc?.user.image ?? null,
        role: employeeDoc?.role ?? 'employee',
      },
    }
  },
})

export const upsert = organizationMutation({
  args: {
    employeeId: v.string(),
    month: v.number(),
    basicSalary: v.optional(v.float64()),
    deduction: v.float64(),
    overtimePay: v.float64(),
    bonus: v.float64(),
    notes: v.optional(v.string()),
  },
  returns: vv.id('payroll'),
  handler: async (ctx, args) => {
    assertOwner(ctx)

    const organizationId = ctx.session.activeOrganizationId
    const { payPeriodStart, payPeriodEnd } = getPayPeriodForMonth(args.month)
    const now = Date.now()

    const compensation = await getActiveCompensationForEmployee(
      ctx,
      organizationId,
      args.employeeId,
      payPeriodStart,
    )

    const basicSalary =
      args.basicSalary ?? compensation?.monthlyBasicSalary ?? null

    if (basicSalary === null) {
      throw new Error('Employee has no active compensation for this month')
    }

    const netSalary = calculateNetSalary({
      basicSalary,
      deduction: args.deduction,
      overtimePay: args.overtimePay,
      bonus: args.bonus,
    })

    const existing = await getPayrollForPeriod(
      ctx,
      organizationId,
      args.employeeId,
      payPeriodStart,
    )

    if (existing) {
      const patch: {
        basicSalary: number
        deduction: number
        overtimePay: number
        bonus: number
        netSalary: number
        notes: string | undefined
        updatedAt: number
        editedAt?: number
      } = {
        basicSalary,
        deduction: args.deduction,
        overtimePay: args.overtimePay,
        bonus: args.bonus,
        netSalary,
        notes: args.notes,
        updatedAt: now,
      }

      if (isPaidPayroll(existing.creditedAt)) {
        patch.editedAt = now
      }

      await ctx.db.patch(existing._id, patch)
      return existing._id
    }

    return await ctx.db.insert('payroll', {
      organizationId,
      employeeId: args.employeeId,
      payPeriodStart,
      payPeriodEnd,
      basicSalary,
      deduction: args.deduction,
      overtimePay: args.overtimePay,
      bonus: args.bonus,
      netSalary,
      notes: args.notes,
      createdAt: now,
    })
  },
})

export const bulkGenerate = organizationMutation({
  args: {
    month: v.number(),
  },
  returns: v.object({
    created: v.number(),
    skipped: v.number(),
  }),
  handler: async (ctx, args) => {
    assertOwner(ctx)

    const organizationId = ctx.session.activeOrganizationId
    const { payPeriodStart, payPeriodEnd } = getPayPeriodForMonth(args.month)
    const now = Date.now()

    const employees = await ctx.runQuery(components.betterAuth.employees.list, {
      organizationId,
      role: 'employee',
    })

    let created = 0
    let skipped = 0

    for (const employee of employees) {
      const existing = await getPayrollForPeriod(
        ctx,
        organizationId,
        employee._id,
        payPeriodStart,
      )
      if (existing) {
        skipped += 1
        continue
      }

      const compensation = await getActiveCompensationForEmployee(
        ctx,
        organizationId,
        employee._id,
        payPeriodStart,
      )

      if (!compensation) {
        skipped += 1
        continue
      }

      const basicSalary = compensation.monthlyBasicSalary
      await ctx.db.insert('payroll', {
        organizationId,
        employeeId: employee._id,
        payPeriodStart,
        payPeriodEnd,
        basicSalary,
        deduction: 0,
        overtimePay: 0,
        bonus: 0,
        netSalary: basicSalary,
        createdAt: now,
      })
      created += 1
    }

    return { created, skipped }
  },
})

export const markPaid = organizationMutation({
  args: {
    ids: v.array(vv.id('payroll')),
    creditedAt: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    assertOwner(ctx)

    const organizationId = ctx.session.activeOrganizationId
    const paidAt = args.creditedAt ?? Date.now()
    const now = Date.now()

    for (const id of args.ids) {
      const record = await ctx.db.get(id)
      if (!record || record.organizationId !== organizationId) {
        throw new Error('Payroll record not found')
      }
      if (isPaidPayroll(record.creditedAt)) {
        continue
      }

      await ctx.db.patch(id, {
        creditedAt: paidAt,
        updatedAt: now,
      })
    }

    return null
  },
})

export const remove = organizationMutation({
  args: {
    id: vv.id('payroll'),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    assertOwner(ctx)

    const record = await ctx.db.get(args.id)
    if (!record || record.organizationId !== ctx.session.activeOrganizationId) {
      throw new Error('Payroll record not found')
    }

    await ctx.db.delete(args.id)
    return null
  },
})
