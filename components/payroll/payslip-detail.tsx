'use client'

import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { formatCurrency } from '@/lib/payroll-types'

type PayslipDetailProps = {
  payslip: NonNullable<typeof api.payroll.get._returnType>
  showDownload?: boolean
  onDownload?: () => void
}

function AmountRow({
  label,
  value,
  emphasize = false,
}: {
  label: string
  value: string
  emphasize?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className={emphasize ? 'font-medium' : 'text-muted-foreground'}>
        {label}
      </span>
      <span className={emphasize ? 'text-base font-semibold' : ''}>
        {value}
      </span>
    </div>
  )
}

export function PayslipDetail({
  payslip,
  showDownload = false,
  onDownload,
}: PayslipDetailProps) {
  return (
    <Card id="payslip-print-area">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Payslip</CardTitle>
          <CardDescription>
            {format(new Date(payslip.payPeriodStart), 'MMMM yyyy')}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {payslip.creditedAt ? (
            <Badge variant="secondary">
              Paid {format(new Date(payslip.creditedAt), 'MMM d, yyyy')}
            </Badge>
          ) : null}
          {showDownload && onDownload ? (
            <Button size="sm" variant="outline" onClick={onDownload}>
              Download PDF
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 text-sm">
          <AmountRow label="Employee" value={payslip.employee.name} />
          <AmountRow label="Email" value={payslip.employee.email} />
          <AmountRow label="Role" value={payslip.employee.role} />
        </div>

        <Separator />

        <div className="space-y-2">
          <AmountRow
            label="Basic salary"
            value={formatCurrency(payslip.basicSalary)}
          />
          <AmountRow
            label="Overtime pay"
            value={formatCurrency(payslip.overtimePay)}
          />
          <AmountRow label="Bonus" value={formatCurrency(payslip.bonus)} />
          <AmountRow
            label="Deductions"
            value={formatCurrency(payslip.deduction)}
          />
        </div>

        <Separator />

        <AmountRow
          label="Net salary"
          value={formatCurrency(payslip.netSalary)}
          emphasize
        />

        {payslip.notes ? (
          <>
            <Separator />
            <div className="text-sm">
              <span className="text-muted-foreground">Notes: </span>
              <span>{payslip.notes}</span>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  )
}

export type PayslipId = Id<'payroll'>

export function printPayslipPdf() {
  window.print()
}
