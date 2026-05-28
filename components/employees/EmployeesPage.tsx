'use client'

import { useQuery } from 'convex-helpers/react/cache'
import { useMemo } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/convex/_generated/api'
import { usePermission } from '@/hooks/use-permission'
import { DataTable } from '../DataTable'
import { type EmployeeRow, employeeColumns } from './employees-columns'

export function EmployeesPage() {
  const { allowed, isLoading: permissionLoading } = usePermission({
    employee: ['list'],
  })
  const employees = useQuery(api.employees.listEmployees, allowed ? {} : 'skip')

  const rows = useMemo<EmployeeRow[]>(() => {
    if (!employees) return []
    return employees.map((employee) => ({
      id: employee.id,
      name: employee.user.name,
      email: employee.user.email,
      image: employee.user.image ?? '',
      role: employee.role,
      active: employee.active,
    }))
  }, [employees])

  if (!permissionLoading && !allowed) {
    return (
      <div className="flex flex-1 flex-col p-6">
        <p className="text-muted-foreground">
          You do not have permission to view employees.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col p-4 md:p-6">
      {employees === undefined ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : employees.length === 0 ? (
        <p className="text-sm text-muted-foreground">No employees yet.</p>
      ) : (
        <DataTable
          columns={employeeColumns}
          data={rows}
          getRowInactive={(row) => !row.active}
        />
      )}
    </div>
  )
}
