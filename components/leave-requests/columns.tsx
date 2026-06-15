'use client'

import type { ColumnDef } from '@tanstack/react-table'
import { api } from '@/convex/_generated/api'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Button } from '../ui/button'
import { formatLeaveDate, leaveTypeLabels } from './leave-formatters'
import { LeaveStatusBadge } from './leave-status-badge'

export type LeaveRequestRow =
  (typeof api.leaveRequest.list._returnType)[number]

function formatReasonCell(row: LeaveRequestRow) {
  if (row.status === 'rejected' && row.rejectionReason) {
    return (
      <div className="max-w-xs space-y-1">
        <span className="line-clamp-2">{row.reason}</span>
        <span className="block text-xs text-destructive">
          Rejected: {row.rejectionReason}
        </span>
      </div>
    )
  }
  return <span className="line-clamp-2 max-w-xs">{row.reason}</span>
}

export function getOwnerLeaveColumns({
  onApprove,
  onReject,
  onEdit,
  processingId,
}: {
  onApprove: (id: LeaveRequestRow['_id']) => void
  onReject: (id: LeaveRequestRow['_id']) => void
  onEdit: (row: LeaveRequestRow) => void
  processingId: LeaveRequestRow['_id'] | null
}): ColumnDef<LeaveRequestRow>[] {
  return [
    {
      header: 'Employee',
      accessorKey: 'employee',
      cell: ({ row }) => {
        const employee = row.original.employee
        if (!employee) {
          return <span className="text-muted-foreground">Unknown</span>
        }
        return (
          <div className="flex items-center gap-3 py-1">
            <Avatar>
              <AvatarImage src={employee.image ?? ''} alt={employee.name} />
              <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate font-medium">{employee.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {employee.email}
              </p>
            </div>
          </div>
        )
      },
    },
    {
      header: 'Type',
      accessorKey: 'leaveType',
      cell: ({ row }) => leaveTypeLabels[row.original.leaveType],
    },
    {
      header: 'Date',
      accessorKey: 'startDate',
      cell: ({ row }) =>
        formatLeaveDate(row.original.startDate, row.original.endDate),
    },
    {
      header: 'Reason',
      accessorKey: 'reason',
      cell: ({ row }) => formatReasonCell(row.original),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }) => <LeaveStatusBadge status={row.original.status} />,
    },
    {
      header: 'Actions',
      id: 'actions',
      cell: ({ row }) => {
        if (row.original.status === 'pending') {
          const isProcessing = processingId === row.original._id
          return (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                disabled={isProcessing}
                onClick={() => onApprove(row.original._id)}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={isProcessing}
                onClick={() => onReject(row.original._id)}
              >
                Reject
              </Button>
            </div>
          )
        }

        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(row.original)}
          >
            {row.original.status === 'approved'
              ? 'Mark rejected'
              : 'Mark approved'}
          </Button>
        )
      },
    },
  ]
}

export function getEmployeeLeaveColumns(): ColumnDef<LeaveRequestRow>[] {
  return [
    {
      header: 'Type',
      accessorKey: 'leaveType',
      cell: ({ row }) => leaveTypeLabels[row.original.leaveType],
    },
    {
      header: 'Date',
      accessorKey: 'startDate',
      cell: ({ row }) =>
        formatLeaveDate(row.original.startDate, row.original.endDate),
    },
    {
      header: 'Reason',
      accessorKey: 'reason',
      cell: ({ row }) => formatReasonCell(row.original),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }) => <LeaveStatusBadge status={row.original.status} />,
    },
  ]
}
