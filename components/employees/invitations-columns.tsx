'use client'

import type { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { InvitationRowActions } from './invitation-row-actions'

export type InvitationRow = {
  id: string
  email: string
  role: string | null
  status: string
  expiresAt: number
}

const baseColumns: ColumnDef<InvitationRow>[] = [
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => (
      <span className="font-medium">{row.original.email}</span>
    ),
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => (
      <Badge variant="secondary" className="capitalize">
        {row.original.role ?? 'employee'}
      </Badge>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span className="size-2 shrink-0 rounded-full bg-chart-4" aria-hidden />
        <span className="text-sm capitalize">{row.original.status}</span>
      </div>
    ),
  },
  {
    accessorKey: 'expiresAt',
    header: 'Expires',
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {format(row.original.expiresAt, 'MMM d, yyyy')}
      </span>
    ),
  },
]

export function createInvitationColumns(options: {
  organizationId: string
  onRequestCancel: (invitation: InvitationRow) => void
}): ColumnDef<InvitationRow>[] {
  return [
    ...baseColumns,
    {
      id: 'actions',
      header: () => <div className="text-right px-3">Actions</div>,
      cell: ({ row }) => (
        <InvitationRowActions
          invitation={row.original}
          organizationId={options.organizationId}
          onRequestCancel={options.onRequestCancel}
        />
      ),
    },
  ]
}

export const invitationColumnsWithoutActions = baseColumns
