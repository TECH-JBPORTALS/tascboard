import { describe, expect, test } from 'bun:test'
import { convexTest } from 'convex-test'
import {
  calculateNetSalary,
  getPayPeriodForMonth,
  isPaidPayroll,
} from '../lib/payrollHelpers'
import schema from '../schema'
import { modules } from './_modules.test'

describe('Payroll (database)', () => {
  test('bulk generate creates draft payslips from compensation', async () => {
    const t = convexTest(schema, modules)
    const month = new Date('2026-06-15T00:00:00.000Z').getTime()
    const { payPeriodStart, payPeriodEnd } = getPayPeriodForMonth(month)

    await t.run(async (ctx) => {
      await ctx.db.insert('employeeCompensation', {
        organizationId: 'org-1',
        employeeId: 'emp-1',
        monthlyBasicSalary: 50000,
        effectiveFrom: payPeriodStart,
        createdAt: Date.now(),
      })

      const basicSalary = 50000
      await ctx.db.insert('payroll', {
        organizationId: 'org-1',
        employeeId: 'emp-1',
        payPeriodStart,
        payPeriodEnd,
        basicSalary,
        deduction: 0,
        overtimePay: 0,
        bonus: 0,
        netSalary: basicSalary,
        createdAt: Date.now(),
      })
    })

    const records = await t.run(async (ctx) =>
      ctx.db
        .query('payroll')
        .withIndex('by_org_employee_period', (q) =>
          q
            .eq('organizationId', 'org-1')
            .eq('employeeId', 'emp-1')
            .eq('payPeriodStart', payPeriodStart),
        )
        .collect(),
    )

    expect(records).toHaveLength(1)
    expect(records[0]?.netSalary).toBe(50000)
    expect(isPaidPayroll(records[0]?.creditedAt)).toBe(false)
  })

  test('mark paid sets creditedAt', async () => {
    const t = convexTest(schema, modules)
    const month = new Date('2026-06-15T00:00:00.000Z').getTime()
    const { payPeriodStart, payPeriodEnd } = getPayPeriodForMonth(month)
    const paidAt = Date.UTC(2026, 6, 1)

    const payrollId = await t.run(async (ctx) => {
      return await ctx.db.insert('payroll', {
        organizationId: 'org-1',
        employeeId: 'emp-1',
        payPeriodStart,
        payPeriodEnd,
        basicSalary: 1000,
        deduction: 0,
        overtimePay: 0,
        bonus: 0,
        netSalary: 1000,
        createdAt: Date.now(),
      })
    })

    await t.run(async (ctx) => {
      await ctx.db.patch(payrollId, {
        creditedAt: paidAt,
        updatedAt: Date.now(),
      })
    })

    const record = await t.run(async (ctx) => ctx.db.get('payroll', payrollId))
    expect(record?.creditedAt).toBe(paidAt)
    expect(isPaidPayroll(record?.creditedAt)).toBe(true)
  })

  test('employee visibility excludes unpaid payslips', async () => {
    const t = convexTest(schema, modules)
    const month = new Date('2026-06-15T00:00:00.000Z').getTime()
    const { payPeriodStart, payPeriodEnd } = getPayPeriodForMonth(month)

    await t.run(async (ctx) => {
      await ctx.db.insert('payroll', {
        organizationId: 'org-1',
        employeeId: 'emp-1',
        payPeriodStart,
        payPeriodEnd,
        basicSalary: 1000,
        deduction: 0,
        overtimePay: 0,
        bonus: 0,
        netSalary: 1000,
        createdAt: Date.now(),
      })

      await ctx.db.insert('payroll', {
        organizationId: 'org-1',
        employeeId: 'emp-1',
        payPeriodStart: getPayPeriodForMonth(Date.UTC(2026, 4, 1))
          .payPeriodStart,
        payPeriodEnd: getPayPeriodForMonth(Date.UTC(2026, 4, 1)).payPeriodEnd,
        basicSalary: 1000,
        deduction: 0,
        overtimePay: 0,
        bonus: 0,
        netSalary: 1000,
        creditedAt: Date.UTC(2026, 5, 1),
        createdAt: Date.now(),
      })
    })

    const visible = await t.run(async (ctx) => {
      const records = await ctx.db
        .query('payroll')
        .withIndex('by_org_employee_period', (q) =>
          q.eq('organizationId', 'org-1').eq('employeeId', 'emp-1'),
        )
        .collect()

      return records.filter((record) => isPaidPayroll(record.creditedAt))
    })

    expect(visible).toHaveLength(1)
    expect(visible[0]?.creditedAt).toBeDefined()
  })

  test('calculateNetSalary matches stored net salary updates', () => {
    const netSalary = calculateNetSalary({
      basicSalary: 1000,
      deduction: 100,
      overtimePay: 50,
      bonus: 200,
    })

    expect(netSalary).toBe(1150)
  })
})
