import { UserAvatar } from '@/components/employees/user-avatar'
import { Progress } from '@/components/ui/progress'
import type { EmployeeRef, LeaveRequest } from '@/lib/attendance-types'

const LEAVE_QUOTA = 24

type Props = { employees: EmployeeRef[]; leaveRequests: LeaveRequest[] }

function getDays(start: number, end: number): number {
  return Math.ceil((end - start) / 86_400_000) + 1
}

function getUsed(employeeId: string, requests: LeaveRequest[]): number {
  const year = new Date().getFullYear()
  return requests
    .filter(
      (r) =>
        r.employeeId === employeeId &&
        r.status === 'approved' &&
        new Date(r.startDate).getFullYear() === year,
    )
    .reduce((acc, r) => acc + getDays(r.startDate, r.endDate), 0)
}

export function LeaveBalanceSection({ employees, leaveRequests }: Props) {
  return (
    <div className='space-y-4 border-t p-4 md:p-6'>
      <p className='text-xs font-medium uppercase tracking-wider text-muted-foreground'>
        Leave Balance {new Date().getFullYear()} — Quota: {LEAVE_QUOTA} days/year
      </p>
      <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
        {employees.map((emp) => {
          const used = getUsed(emp.id, leaveRequests)
          const remaining = Math.max(0, LEAVE_QUOTA - used)
          const pct = Math.round((used / LEAVE_QUOTA) * 100)
          return (
            <div key={emp.id} className='space-y-2 rounded-lg border bg-card p-3'>
              <div className='flex items-center gap-2'>
                <UserAvatar name={emp.name} imageUrl={emp.image} className='size-7' />
                <div className='min-w-0'>
                  <p className='truncate text-sm font-medium'>{emp.name}</p>
                  <p className='text-xs text-muted-foreground'>
                    {used} used · {remaining} remaining
                  </p>
                </div>
              </div>
              <Progress value={pct} className='h-1.5' />
            </div>
          )
        })}
      </div>
    </div>
  )
}