'use client'

import type { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { api } from '@/convex/_generated/api'
import { formatCurrency, getPayrollStatus } from '@/lib/payroll-types'
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar'

export type OwnerPayrollRow =
  (typeof api.payroll.listByMonth._returnType)[number]

type ColumnOptions = {
  onEdit: (row: OwnerPayrollRow) => void
  onMarkPaid: (row: OwnerPayrollRow) => void
  markingPaidId: string | null
}

export function createOwnerPayrollColumns({
  onEdit,
  onMarkPaid,
  markingPaidId,
}: ColumnOptions): ColumnDef<OwnerPayrollRow>[] {
  return [
    {
      header: 'Employee',
      accessorKey: 'employee',
      cell: ({ row }) => {
        const employee = row.original.employee
        return (
          <div className="flex items-center gap-3 py-1">
            <Avatar>
              <AvatarImage
                src={employee.image ?? ''}
                alt={`${employee.name}'s avatar`}
              />
              <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="font-medium">{employee.name}</div>
              <div className="text-xs text-muted-foreground">
                {employee.email}
              </div>
            </div>
          </div>
        )
      },
    },
    {
      header: 'Base salary',
      accessorKey: 'monthlyBasicSalary',
      cell: ({ row }) =>
        row.original.monthlyBasicSalary !== null
          ? formatCurrency(row.original.monthlyBasicSalary)
          : 'Not set',
    },
    {
      header: 'Net salary',
      accessorKey: 'payroll.netSalary',
      cell: ({ row }) => {
        const payroll = row.original.payroll
        return payroll ? formatCurrency(payroll.netSalary) : '—'
      },
    },
    {
      header: 'Status',
      accessorKey: 'payroll.creditedAt',
      cell: ({ row }) => {
        const payroll = row.original.payroll
        if (!payroll) {
          return <Badge variant="outline">Not generated</Badge>
        }
        const status = getPayrollStatus(payroll.creditedAt)
        return (
          <Badge variant={status === 'paid' ? 'secondary' : 'outline'}>
            {status === 'paid'
              ? `Paid ${format(new Date(payroll.creditedAt!), 'MMM d')}`
              : 'Unpaid'}
          </Badge>
        )
      },
    },
    {
      header: 'Actions',
      id: 'actions',
      cell: ({ row }) => {
        const payroll = row.original.payroll
        const isPaid = payroll?.creditedAt !== undefined

        return (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={row.original.monthlyBasicSalary === null && !payroll}
              onClick={() => onEdit(row.original)}
            >
              {payroll ? 'Edit' : 'Create'}
            </Button>
            {payroll && !isPaid ? (
              <Button
                size="sm"
                disabled={markingPaidId === payroll._id}
                onClick={() => onMarkPaid(row.original)}
              >
                {markingPaidId === payroll._id ? 'Marking...' : 'Mark paid'}
              </Button>
            ) : null}
          </div>
        )
      },
    },
  ]
}
