'use client'

import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import {
  formatCurrency,
  getPayrollStatus,
  type PayrollRecord,
} from '@/lib/payroll-types'

type Props = {
  onOpenChange: (open: boolean) => void
  open: boolean
  record: PayrollRecord | null
}

function Row({
  label,
  value,
  bold,
}: {
  label: string
  value: string
  bold?: boolean
}) {
  return (
    <>
      <p
        className={
          bold ? 'text-sm font-semibold' : 'text-sm text-muted-foreground'
        }
      >
        {label}
      </p>
      <p className={`text-right text-sm ${bold ? 'font-bold' : 'font-medium'}`}>
        {value}
      </p>
    </>
  )
}

export function PayslipDialog({ onOpenChange, open, record }: Props) {
  if (!record) return null

  const status = getPayrollStatus(record.creditedAt)
  const monthYear = format(new Date(record.creditedAt), 'MMMM yyyy')
  const totalBonus =
    record.performanceBonus + record.festivalBonus + record.manualReward
  const otherDed =
    record.loanRecovery +
    record.leaveDeduction +
    record.latePenalty +
    record.otherDeductions

  const handlePrint = () => {
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<html><head><title>Payslip - ${record.employeeName} - ${monthYear}</title>
      <style>body{font-family:sans-serif;padding:32px;max-width:600px;margin:auto}
      table{width:100%;border-collapse:collapse}td{padding:6px 0;font-size:14px}
      .label{color:#6b7280}.right{text-align:right}.bold{font-weight:700}
      hr{border:none;border-top:1px solid #e5e7eb;margin:12px 0}
      h2{margin:0}p{margin:4px 0}</style></head><body>
      <h2>Payslip — ${monthYear}</h2>
      <p><strong>${record.employeeName}</strong> · ${record.employeeRole}</p>
      <p>Status: ${status === 'paid' ? 'Paid' : 'Unpaid'}</p><hr/>
      <table>
        <tr><td class="label">Basic Salary</td><td class="right">${formatCurrency(record.basicSalary)}</td></tr>
        <tr><td class="label">HRA</td><td class="right">${formatCurrency(record.hra)}</td></tr>
        <tr><td class="label">Allowances</td><td class="right">${formatCurrency(record.allowances)}</td></tr>
        <tr><td class="label">Incentives</td><td class="right">${formatCurrency(record.incentives)}</td></tr>
        <tr><td class="label">Overtime (${record.overtimeHours}h)</td><td class="right">${formatCurrency(record.overtimeAmount)}</td></tr>
        <tr><td class="label">Bonus</td><td class="right">${formatCurrency(totalBonus)}</td></tr>
      </table><hr/>
      <table>
        <tr><td class="label">PF + ESI</td><td class="right">${formatCurrency(record.pfAmount + record.esiAmount)}</td></tr>
        <tr><td class="label">Tax</td><td class="right">${formatCurrency(record.tax)}</td></tr>
        <tr><td class="label">Other Deductions</td><td class="right">${formatCurrency(otherDed)}</td></tr>
      </table><hr/>
      <table><tr><td class="bold">Net Salary</td><td class="right bold">${formatCurrency(record.netSalary)}</td></tr></table>
      </body></html>`)
    win.document.close()
    win.focus()
    win.print()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Payslip — {monthYear}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 text-sm">
          <div className="flex items-center justify-between">
            <p className="font-medium">{record.employeeName}</p>
            <p className="text-muted-foreground">{record.employeeRole}</p>
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            <Row
              label="Basic Salary"
              value={formatCurrency(record.basicSalary)}
            />
            <Row label="HRA" value={formatCurrency(record.hra)} />
            <Row label="Allowances" value={formatCurrency(record.allowances)} />
            <Row label="Incentives" value={formatCurrency(record.incentives)} />
            <Row
              label={`Overtime (${record.overtimeHours}h)`}
              value={formatCurrency(record.overtimeAmount)}
            />
            <Row label="Bonus" value={formatCurrency(totalBonus)} />
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            <Row
              label="PF + ESI"
              value={formatCurrency(record.pfAmount + record.esiAmount)}
            />
            <Row label="Tax" value={formatCurrency(record.tax)} />
            <Row label="Other Deductions" value={formatCurrency(otherDed)} />
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-x-4">
            <Row
              label="Net Salary"
              value={formatCurrency(record.netSalary)}
              bold
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handlePrint}>Print / Download PDF</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
