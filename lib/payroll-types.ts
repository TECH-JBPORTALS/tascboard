export type PayrollStatus = 'paid' | 'unpaid'

export type PayrollRecord = {
  id: string
  employeeId: string
  employeeName: string
  employeeRole: string
  avatarUrl?: string | null
  payPeriodStart: number
  payPeriodEnd: number
  creditedAt?: number
  basicSalary: number
  deduction: number
  overtimePay: number
  bonus: number
  netSalary: number
  notes?: string
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function getPayrollStatus(creditedAt?: number): PayrollStatus {
  return creditedAt !== undefined ? 'paid' : 'unpaid'
}

export function getYear(ts: number): number {
  return new Date(ts).getFullYear()
}

export function getMonth(ts: number): number {
  return new Date(ts).getMonth() + 1
}

export function calculateNetSalary(args: {
  basicSalary: number
  deduction: number
  overtimePay: number
  bonus: number
}): number {
  return args.basicSalary + args.overtimePay + args.bonus - args.deduction
}
