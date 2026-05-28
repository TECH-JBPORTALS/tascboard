'use client'

import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { UserAvatar } from './user-avatar'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export type EmployeeRow = {
  id: string
  name: string
  email: string
  image: string | null
  role: string
  active: boolean
}

function StatusIndicator({ active }: { active: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          'size-2 shrink-0 rounded-full',
          active ? 'bg-primary' : 'bg-muted-foreground/50',
        )}
        aria-hidden
      />
      <span className="text-sm">{active ? 'Active' : 'Inactive'}</span>
    </div>
  )
}

export const employeeColumns: ColumnDef<EmployeeRow>[] = [
  {
    id: 'employee',
    header: 'Employee',
    cell: ({ row }) => {
      const params = useParams()
      return (
        <div className="flex min-w-0 items-center gap-3 py-1">
          <UserAvatar
            name={row.original.name}
            imageUrl={row.original.image}
            className="size-9"
          />
          <div className="min-w-0">
            <Link
              href={`/${params.orgSlug}/employees/${row.original.id}`}
              className="truncate font-medium"
            >
              {row.original.name}
            </Link>
            <p className="truncate text-sm text-muted-foreground">
              {row.original.email}
            </p>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => (
      <Badge variant="secondary" className="capitalize">
        {row.original.role}
      </Badge>
    ),
  },
  {
    accessorKey: 'active',
    header: 'Status',
    cell: ({ row }) => <StatusIndicator active={row.original.active} />,
  },
]
