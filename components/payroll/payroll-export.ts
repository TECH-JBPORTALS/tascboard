import { format } from 'date-fns'
import {
  formatCurrency,
  getPayrollStatus,
  type PayrollRecord,
} from '@/lib/payroll-types'

export function exportPayrollCsv(records: PayrollRecord[], label: string) {
  const rows = [
    [
      'Employee',
      'Role',
      'Month',
      'Gross',
      'Deductions',
      'Net Salary',
      'Status',
    ],
    ...records.map((r) => [
      r.employeeName,
      r.employeeRole,
      format(new Date(r.creditedAt), 'MMM yyyy'),
      formatCurrency(r.grossSalary),
      formatCurrency(r.totalDeductions),
      formatCurrency(r.netSalary),
      getPayrollStatus(r.creditedAt) === 'paid' ? 'Paid' : 'Unpaid',
    ]),
  ]
  const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  a.download = `payroll-${label}.csv`
  a.click()
}
