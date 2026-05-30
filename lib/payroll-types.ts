export type PayrollStatus = 'paid' | 'unpaid'

export type PayrollRecord = {
  id: string
  employeeId: string
  employeeName: string
  employeeRole: string
  avatarUrl?: string | null
  creditedAt: number
  basicSalary: number
  hra: number
  allowances: number
  incentives: number
  pfAmount: number
  esiAmount: number
  tax: number
  loanRecovery: number
  leaveDeduction: number
  latePenalty: number
  otherDeductions: number
  overtimeHours: number
  overtimeRate: number
  overtimeAmount: number
  performanceBonus: number
  festivalBonus: number
  manualReward: number
  grossSalary: number
  totalDeductions: number
  netSalary: number
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function getPayrollStatus(creditedAt: number): PayrollStatus {
  const now = new Date()
  const credited = new Date(creditedAt)
  return credited.getMonth() === now.getMonth() &&
    credited.getFullYear() === now.getFullYear()
    ? 'paid'
    : 'unpaid'
}

export function getYear(ts: number): number {
  return new Date(ts).getFullYear()
}

export function getMonth(ts: number): number {
  return new Date(ts).getMonth() + 1
}
