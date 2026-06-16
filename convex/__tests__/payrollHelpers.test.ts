import { describe, expect, test } from 'bun:test'
import {
  calculateNetSalary,
  findActiveCompensation,
  getPayPeriodForMonth,
  isPaidPayroll,
} from '../lib/payrollHelpers'

describe('payrollHelpers', () => {
  test('calculateNetSalary sums earnings and subtracts deductions', () => {
    expect(
      calculateNetSalary({
        basicSalary: 1000,
        deduction: 100,
        overtimePay: 50,
        bonus: 200,
      }),
    ).toBe(1150)
  })

  test('getPayPeriodForMonth returns calendar month bounds', () => {
    const month = new Date('2026-06-15T00:00:00.000Z').getTime()
    const period = getPayPeriodForMonth(month)
    expect(period.payPeriodStart).toBeLessThan(period.payPeriodEnd)
  })

  test('findActiveCompensation picks latest matching row', () => {
    const rows = [
      {
        effectiveFrom: Date.UTC(2026, 0, 1),
        effectiveTo: Date.UTC(2026, 2, 31),
      },
      { effectiveFrom: Date.UTC(2026, 3, 1) },
    ]

    const active = findActiveCompensation(rows, Date.UTC(2026, 5, 1))
    expect(active?.effectiveFrom).toBe(Date.UTC(2026, 3, 1))
  })

  test('isPaidPayroll reflects creditedAt presence', () => {
    expect(isPaidPayroll(undefined)).toBe(false)
    expect(isPaidPayroll(Date.now())).toBe(true)
  })
})
