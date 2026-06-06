import type { Id } from '@/convex/_generated/dataModel'
import type { PayrollRecord } from '@/lib/payroll-types'

type RawPayroll = {
  _id: Id<'payroll'>
  employeeId: string
  creditedAt: number
  basicSalary: number
  deduction: number
  overtimePay: number
  bonus: number
  netSalary: number
}

type EmployeeMini = {
  id: string
  name: string
  role: string
  image: string | null
}

export function toPayrollRecord(
  raw: RawPayroll,
  employees: EmployeeMini[],
): PayrollRecord {
  const emp = employees.find((e) => e.id === raw.employeeId)
  return {
    id: raw._id,
    employeeId: raw.employeeId,
    employeeName: emp?.name ?? raw.employeeId,
    employeeRole: emp?.role ?? '',
    avatarUrl: emp?.image ?? null,
    creditedAt: raw.creditedAt,
    basicSalary: raw.basicSalary,
    hra: 0,
    allowances: 0,
    incentives: 0,
    pfAmount: 0,
    esiAmount: 0,
    tax: raw.deduction,
    loanRecovery: 0,
    leaveDeduction: 0,
    latePenalty: 0,
    otherDeductions: 0,
    overtimeHours: 0,
    overtimeRate: 0,
    overtimeAmount: raw.overtimePay,
    performanceBonus: raw.bonus,
    festivalBonus: 0,
    manualReward: 0,
    grossSalary: raw.basicSalary + raw.overtimePay + raw.bonus,
    totalDeductions: raw.deduction,
    netSalary: raw.netSalary,
  }
}