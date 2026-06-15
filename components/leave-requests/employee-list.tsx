'use client'

import { RiAddLine } from '@remixicon/react'
import { useMutation } from 'convex/react'
import { useQuery } from 'convex-helpers/react/cache'
import { isEmpty } from 'lodash'
import { useState } from 'react'
import { toast } from 'sonner'
import { DataTable } from '@/components/data-table'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '../ui/empty'
import { getEmployeeLeaveColumns } from './columns'
import { LeaveTableSkeleton } from './leave-table-skeleton'
import { RaiseLeaveDialog } from './raise-leave-dialog'

export function LeaveRequestsEmployee() {
  const requests = useQuery(api.leaveRequest.list)
  const balance = useQuery(api.leaveRequest.getLeaveBalance)
  const cancelLeave = useMutation(api.leaveRequest.cancelLeaveRequest)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [cancellingId, setCancellingId] =
    useState<Id<'leaveRequests'> | null>(null)

  async function handleCancel(leaveRequestId: Id<'leaveRequests'>) {
    setCancellingId(leaveRequestId)
    try {
      await cancelLeave({ leaveRequestId })
      toast.success('Leave request cancelled')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to cancel request',
      )
    } finally {
      setCancellingId(null)
    }
  }

  const columns = getEmployeeLeaveColumns()
  const isLoading = requests === undefined || balance === undefined

  return (
    <div className="space-y-4 px-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {balance ? (
          <Card className="min-w-[220px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Leave balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums">
                {balance.remaining}
                <span className="ml-1 text-sm font-normal text-muted-foreground">
                  / {balance.leaveQuota} days
                </span>
              </p>
            </CardContent>
          </Card>
        ) : null}
        <Button onClick={() => setDialogOpen(true)}>
          <RiAddLine />
          Request leave
        </Button>
      </div>

      {isLoading ? (
        <LeaveTableSkeleton />
      ) : isEmpty(requests) ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No leave requests yet</EmptyTitle>
            <EmptyDescription>
              Submit a request when you need time off.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" onClick={() => setDialogOpen(true)}>
              Request leave
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="space-y-4">
          <DataTable columns={columns} data={requests} />
          {requests.some((request) => request.status === 'pending') ? (
            <div className="flex flex-wrap gap-2">
              {requests
                .filter((request) => request.status === 'pending')
                .map((request) => (
                  <Button
                    key={request._id}
                    size="sm"
                    variant="outline"
                    disabled={cancellingId === request._id}
                    onClick={() => handleCancel(request._id)}
                  >
                    Cancel pending request (
                    {new Date(request.startDate).toLocaleDateString()})
                  </Button>
                ))}
            </div>
          ) : null}
        </div>
      )}

      <RaiseLeaveDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
