'use client'

import {
  RiCheckLine,
  RiCloseLine,
  RiDeleteBinLine,
  RiMoreLine,
  RiProhibitedLine,
} from '@remixicon/react'
import { useMutation } from 'convex/react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { api } from '@/convex/_generated/api'
import { useActor } from '@/hooks/use-actor'
import type { EnrichedLeave } from '@/lib/attendance-types'

type Props = { record: EnrichedLeave }

export function LeaveRowActions({ record }: Props) {
  const { deviceName } = useActor()
  const update = useMutation(api.leaveRequest.update)
  const remove = useMutation(api.leaveRequest.remove)

  const handleApprove = () =>
    update({ leaveRequestId: record._id, body: { status: 'approved', approvedBy: deviceName } })

  const handleReject = () =>
    update({ leaveRequestId: record._id, body: { status: 'rejected', approvedBy: deviceName } })

  const handleCancel = () => remove({ leaveRequestId: record._id })

  const handleDelete = () => remove({ leaveRequestId: record._id })

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant='ghost' size='sm' className='size-8 p-0'>
            <RiMoreLine className='size-4' />
          </Button>
        }
      />
      <DropdownMenuContent align='end'>
        {record.status === 'pending' ? (
          <>
            <DropdownMenuItem onClick={handleApprove}>
              <RiCheckLine className='size-4' />
              Approve
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleReject}>
              <RiCloseLine className='size-4' />
              Reject
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCancel}>
              <RiProhibitedLine className='size-4' />
              Cancel Request
            </DropdownMenuItem>
          </>
        ) : null}
        <DropdownMenuItem className='text-destructive' onClick={handleDelete}>
          <RiDeleteBinLine className='size-4' />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}