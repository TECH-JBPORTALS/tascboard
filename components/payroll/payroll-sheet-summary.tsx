import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatCurrency, getPayrollStatus } from '@/lib/payroll-types'

interface PayrollSheetSummaryProps {
  creditedAt: number
  grossSalary: number
  netSalary: number
  totalDeductions: number
}

export function PayrollSheetSummary({
  creditedAt,
  grossSalary,
  netSalary,
  totalDeductions,
}: PayrollSheetSummaryProps) {
  const status = getPayrollStatus(creditedAt)

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Gross Salary</p>
        <p className="text-sm font-medium">{formatCurrency(grossSalary)}</p>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Total Deductions</p>
        <p className="text-sm font-medium text-destructive">
          − {formatCurrency(totalDeductions)}
        </p>
      </div>
      <Separator />
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Net Salary</p>
        <div className="flex items-center gap-2">
          <Badge variant={status === 'paid' ? 'default' : 'outline'}>
            {status === 'paid' ? 'Paid' : 'Unpaid'}
          </Badge>
          <p className="text-sm font-bold">{formatCurrency(netSalary)}</p>
        </div>
      </div>
    </div>
  )
}
