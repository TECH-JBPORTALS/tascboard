import { format } from 'date-fns'
import { formatCurrency } from './payroll-types'

type PayrollCsvRow = {
  employeeName: string
  employeeEmail: string
  payPeriodStart: number
  payPeriodEnd: number
  basicSalary: number
  deduction: number
  overtimePay: number
  bonus: number
  netSalary: number
  creditedAt?: number
}

export function payrollRowsToCsv(rows: PayrollCsvRow[]): string {
  const headers = [
    'Employee Name',
    'Employee Email',
    'Period Start',
    'Period End',
    'Basic Salary',
    'Deduction',
    'Overtime Pay',
    'Bonus',
    'Net Salary',
    'Paid Date',
    'Status',
  ]

  const lines = rows.map((row) => [
    row.employeeName,
    row.employeeEmail,
    format(new Date(row.payPeriodStart), 'yyyy-MM-dd'),
    format(new Date(row.payPeriodEnd), 'yyyy-MM-dd'),
    String(row.basicSalary),
    String(row.deduction),
    String(row.overtimePay),
    String(row.bonus),
    String(row.netSalary),
    row.creditedAt ? format(new Date(row.creditedAt), 'yyyy-MM-dd') : '',
    row.creditedAt ? 'Paid' : 'Unpaid',
  ])

  return [headers, ...lines]
    .map((cells) =>
      cells.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','),
    )
    .join('\n')
}

export function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function formatPayrollAmount(amount: number): string {
  return formatCurrency(amount)
}
