'use client'

import { format } from 'date-fns'
import { UserAvatar } from '@/components/employees/user-avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatCurrency, type PayrollRecord } from '@/lib/payroll-types'
import { PayrollSheetSection, SheetRow } from './payroll-sheet-section'
import { PayrollSheetSummary } from './payroll-sheet-summary'

type Props = {
  onOpenChange: (open: boolean) => void
  open: boolean
  record: PayrollRecord | null
}

export function PayrollSheet({ onOpenChange, open, record }: Props) {
  if (!record) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <UserAvatar
              name={record.employeeName}
              imageUrl={record.avatarUrl}
            />
            <div>
              <DialogTitle>{record.employeeName}</DialogTitle>
              <DialogDescription>
                {record.employeeRole} ·{' '}
                {format(new Date(record.creditedAt), 'MMMM yyyy')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="flex flex-col gap-5">
          <PayrollSheetSection title="Earnings">
            <SheetRow
              label="Basic Salary"
              value={formatCurrency(record.basicSalary)}
            />
            <SheetRow label="HRA" value={formatCurrency(record.hra)} />
            <SheetRow
              label="Allowances"
              value={formatCurrency(record.allowances)}
            />
            <SheetRow
              label="Overtime Pay"
              value={formatCurrency(record.overtimeAmount)}
            />
            {record.incentives > 0 && (
              <SheetRow
                label="Incentives"
                value={formatCurrency(record.incentives)}
              />
            )}
            {record.performanceBonus > 0 && (
              <SheetRow
                label="Performance Bonus"
                value={formatCurrency(record.performanceBonus)}
              />
            )}
            {record.festivalBonus > 0 && (
              <SheetRow
                label="Festival Bonus"
                value={formatCurrency(record.festivalBonus)}
              />
            )}
            {record.manualReward > 0 && (
              <SheetRow
                label="Manual Reward"
                value={formatCurrency(record.manualReward)}
              />
            )}
          </PayrollSheetSection>
          <PayrollSheetSection title="Deductions">
            <SheetRow label="PF" value={formatCurrency(record.pfAmount)} />
            <SheetRow label="ESI" value={formatCurrency(record.esiAmount)} />
            <SheetRow label="Tax" value={formatCurrency(record.tax)} />
            {record.loanRecovery > 0 && (
              <SheetRow
                label="Loan Recovery"
                value={formatCurrency(record.loanRecovery)}
              />
            )}
            {record.leaveDeduction > 0 && (
              <SheetRow
                label="Leave Deduction"
                value={formatCurrency(record.leaveDeduction)}
              />
            )}
            {record.latePenalty > 0 && (
              <SheetRow
                label="Late Penalty"
                value={formatCurrency(record.latePenalty)}
              />
            )}
            {record.otherDeductions > 0 && (
              <SheetRow
                label="Other"
                value={formatCurrency(record.otherDeductions)}
              />
            )}
          </PayrollSheetSection>
          {record.overtimeHours > 0 && (
            <PayrollSheetSection title="Overtime">
              <SheetRow label="Hours" value={`${record.overtimeHours}h`} />
              <SheetRow
                label="Rate / hr"
                value={formatCurrency(record.overtimeRate)}
              />
              <SheetRow
                label="Total"
                value={formatCurrency(record.overtimeAmount)}
                highlight
              />
            </PayrollSheetSection>
          )}
          <PayrollSheetSummary
            creditedAt={record.creditedAt}
            grossSalary={record.grossSalary}
            netSalary={record.netSalary}
            totalDeductions={record.totalDeductions}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
