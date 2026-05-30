'use client'

import { RiCalendarLine } from '@remixicon/react'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { Id } from '@/convex/_generated/dataModel'
import { type MeetingRow , RECURRENCE_LABELS  } from '@/lib/meeting-types'
import { ScheduleList } from './schedule-list'

interface ScheduleSheetProps {
  meeting: MeetingRow | null
  onOpenChange: (open: boolean) => void
  open: boolean
}

export function ScheduleSheet({
  meeting,
  onOpenChange,
  open,
}: ScheduleSheetProps) {
  if (!meeting) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <RiCalendarLine className="size-4 text-muted-foreground" />
            <SheetTitle>{meeting.title}</SheetTitle>
          </div>
          <SheetDescription>
            {RECURRENCE_LABELS[meeting.recurrenceType]} ·{' '}
            {meeting.description || 'No description'}
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4 pb-4">
          <ScheduleList meetingId={meeting._id as Id<'meeting'>} />
        </div>
      </SheetContent>
    </Sheet>
  )
}