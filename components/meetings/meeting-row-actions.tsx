'use client'

import {
  RiCalendarScheduleLine,
  RiDeleteBinLine,
  RiMoreLine,
  RiPencilLine,
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
import type { Id } from '@/convex/_generated/dataModel'

interface MeetingRowActionsProps {
  meetingId: Id<'meeting'>
  onViewSchedules: () => void
}

export function MeetingRowActions({
  meetingId,
  onViewSchedules,
}: MeetingRowActionsProps) {
  const remove = useMutation(api.meeting.remove)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon">
            <RiMoreLine />
            <span className="sr-only">Open actions</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onViewSchedules}>
          <RiCalendarScheduleLine />
          View Schedules
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => void remove({ meetingId })}
        >
          <RiDeleteBinLine />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}