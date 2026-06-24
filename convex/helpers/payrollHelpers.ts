import { getCalendarMonthRange } from './attendanceSummary'

export function calculateNetSalary(args: {
  basicSalary: number
  deduction: number
  overtimePay: number
  bonus: number
}): number {
  return args.basicSalary + args.overtimePay + args.bonus - args.deduction
}

export function getPayPeriodForMonth(month: number): {
  payPeriodStart: number
  payPeriodEnd: number
} {
  const { start, end } = getCalendarMonthRange(month)
  return { payPeriodStart: start, payPeriodEnd: end }
}

export function getYearRange(year: number): { start: number; end: number } {
  return {
    start: Date.UTC(year, 0, 1),
    end: Date.UTC(year, 11, 31),
  }
}

export function isPaidPayroll(creditedAt: number | undefined): boolean {
  return creditedAt !== undefined
}

export function findActiveCompensation<
  T extends { effectiveFrom: number; effectiveTo?: number },
>(rows: T[], payPeriodStart: number): T | null {
  const matching = rows
    .filter(
      (row) =>
        row.effectiveFrom <= payPeriodStart &&
        (row.effectiveTo === undefined || row.effectiveTo >= payPeriodStart),
    )
    .sort((a, b) => b.effectiveFrom - a.effectiveFrom)

  return matching[0] ?? null
}
