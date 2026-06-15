'use client'

import { useMutation } from 'convex/react'
import { useQuery } from 'convex-helpers/react/cache'
import { isEmpty } from 'lodash'
import { useState } from 'react'
import { toast } from 'sonner'
import { DataTable } from '@/components/data-table'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '../ui/empty'
import { getOwnerLeaveColumns, type LeaveRequestRow } from './columns'
import { EditLeaveDialog } from './edit-leave-dialog'
import { LeaveTableSkeleton } from './leave-table-skeleton'
import { RejectLeaveDialog } from './reject-leave-dialog'

export function LeaveRequestsOwner() {
  const requests = useQuery(api.leaveRequest.list)
  const approveLeave = useMutation(api.leaveRequest.approveLeaveRequest)
  const [processingId, setProcessingId] =
    useState<Id<'leaveRequests'> | null>(null)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectingId, setRejectingId] = useState<Id<'leaveRequests'> | null>(
    null,
  )
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingRequest, setEditingRequest] = useState<LeaveRequestRow | null>(
    null,
  )

  async function handleApprove(leaveRequestId: Id<'leaveRequests'>) {
    setProcessingId(leaveRequestId)
    try {
      await approveLeave({ leaveRequestId })
      toast.success('Leave request approved')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to approve request',
      )
    } finally {
      setProcessingId(null)
    }
  }

  function handleReject(leaveRequestId: Id<'leaveRequests'>) {
    setRejectingId(leaveRequestId)
    setRejectDialogOpen(true)
  }

  function handleEdit(request: LeaveRequestRow) {
    setEditingRequest(request)
    setEditDialogOpen(true)
  }

  if (requests === undefined) {
    return (
      <div className="space-y-4 px-6 py-4">
        <LeaveTableSkeleton showEmployeeColumn />
      </div>
    )
  }

  if (isEmpty(requests)) {
    return (
      <div className="px-6 py-4">
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No leave requests</EmptyTitle>
            <EmptyDescription>
              Employee leave requests will appear here for review.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4 px-6 py-4">
        <DataTable
          columns={getOwnerLeaveColumns({
            onApprove: handleApprove,
            onReject: handleReject,
            onEdit: handleEdit,
            processingId,
          })}
          data={requests}
        />
      </div>
      <RejectLeaveDialog
        leaveRequestId={rejectingId}
        open={rejectDialogOpen}
        onOpenChange={(open) => {
          setRejectDialogOpen(open)
          if (!open) {
            setRejectingId(null)
          }
        }}
      />
      <EditLeaveDialog
        request={editingRequest}
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open)
          if (!open) {
            setEditingRequest(null)
          }
        }}
      />
    </>
  )
}
