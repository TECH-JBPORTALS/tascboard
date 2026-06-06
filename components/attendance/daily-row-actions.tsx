'use client'

import {
  RiDeleteBinLine,
  RiEditLine,
  RiLoginBoxLine,
  RiMoreLine,
} from '@remixicon/react'
import { useMutation } from 'convex/react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { api } from '@/convex/_generated/api'
import type { EnrichedAttendance } from '@/lib/attendance-types'

type Props = {
  onEdit: (record: EnrichedAttendance) => void
  record: EnrichedAttendance
}

export function DailyRowActions({ onEdit, record }: Props) {
  const markLogout = useMutation(api.attendance.markLogout)
  const remove = useMutation(api.attendance.deleteAttendance)

  const handleCheckout = () =>
    void markLogout({ attendanceId: record._id, logoutTime: Date.now() })

  const handleDelete = () => void remove({ attendanceId: record._id })

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon">
            <RiMoreLine />
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(record)}>
          <RiEditLine />
          Edit
        </DropdownMenuItem>
        {!record.logoutTime ? (
          <DropdownMenuItem onClick={handleCheckout}>
            <RiLoginBoxLine />
            Mark Check Out
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={handleDelete}>
          <RiDeleteBinLine />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
