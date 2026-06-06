'use client'

import {
  RiCheckLine,
  RiDeleteBinLine,
  RiEditLine,
  RiFileTextLine,
  RiMoreLine,
} from '@remixicon/react'
import { useMutation } from 'convex/react'
import { toast } from 'sonner'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'

interface MeetingRowActionsProps {
  meetingId: string
  scheduleMeetingId?: string
  onEdit: () => void
  onNotes: () => void
  onAttendance: () => void
}

export function MeetingRowActions({
  meetingId,
  scheduleMeetingId,
  onEdit,
  onNotes,
  onAttendance,
}: MeetingRowActionsProps) {
  const removeMeeting = useMutation(api.meeting.remove)

  const handleDelete = async () => {
    try {
      await removeMeeting({ meetingId: meetingId as Id<'meeting'> })
      toast.success('Meeting deleted')
    } catch {
      toast.error('Failed to delete meeting')
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant='ghost'
            size='sm'
            className='size-7 p-0 opacity-0 group-hover:opacity-100'
          >
            <RiMoreLine className='size-4' />
          </Button>
        }
      />
      <DropdownMenuContent align='end' className='w-44'>
        <DropdownMenuItem onClick={onEdit}>
          <RiEditLine className='mr-2 size-3.5' />
          Edit meeting
        </DropdownMenuItem>
        {scheduleMeetingId && (
          <>
            <DropdownMenuItem onClick={onAttendance}>
              <RiCheckLine className='mr-2 size-3.5' />
              Track attendance
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onNotes}>
              <RiFileTextLine className='mr-2 size-3.5' />
              Add notes
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleDelete}
          className='text-destructive focus:text-destructive'
        >
          <RiDeleteBinLine className='mr-2 size-3.5' />
          Delete meeting
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}