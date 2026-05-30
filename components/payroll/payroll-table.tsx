'use client'

import { format } from 'date-fns'
import { UserAvatar } from '@/components/employees/user-avatar'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  formatCurrency,
  getPayrollStatus,
  type PayrollRecord,
} from '@/lib/payroll-types'
import { PayrollRowActions } from './payroll-row-actions'

type Props = {
  onDelete: (id: string) => void
  onDownload: (record: PayrollRecord) => void
  onEdit: (record: PayrollRecord) => void
  records: PayrollRecord[]
}

export function PayrollTable({ onDelete, onDownload, onEdit, records }: Props) {
  if (records.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-muted-foreground">
          No payroll records found.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Month</TableHead>
            <TableHead>Gross</TableHead>
            <TableHead>Deductions</TableHead>
            <TableHead>Net Salary</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((r) => {
            const status = getPayrollStatus(r.creditedAt)
            return (
              <TableRow
                key={r.id}
                className="cursor-pointer"
                onClick={() => onEdit(r)}
              >
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <UserAvatar name={r.employeeName} imageUrl={r.avatarUrl} />
                    <div>
                      <p className="text-sm font-medium">{r.employeeName}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.employeeRole}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  {format(new Date(r.creditedAt), 'MMM yyyy')}
                </TableCell>
                <TableCell className="text-sm">
                  {formatCurrency(r.grossSalary)}
                </TableCell>
                <TableCell className="text-sm text-destructive">
                  − {formatCurrency(r.totalDeductions)}
                </TableCell>
                <TableCell className="text-sm font-semibold">
                  {formatCurrency(r.netSalary)}
                </TableCell>
                <TableCell>
                  <Badge variant={status === 'paid' ? 'default' : 'outline'}>
                    {status === 'paid' ? 'Paid' : 'Unpaid'}
                  </Badge>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <PayrollRowActions
                    record={r}
                    onDelete={onDelete}
                    onDownload={onDownload}
                    onEdit={onEdit}
                  />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
