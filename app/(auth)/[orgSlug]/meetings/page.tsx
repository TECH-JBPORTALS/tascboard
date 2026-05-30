'use client'

import { RiAddLine, RiCalendarCheckLine } from '@remixicon/react'
import { useQuery } from 'convex/react'
import { useState } from 'react'

import { CreateMeetingDialog } from '@/components/meetings/create-meeting-dialog'
import { MeetingEmpty } from '@/components/meetings/meeting-empty'
import { MeetingList } from '@/components/meetings/meeting-list'
import { ScheduleSheet } from '@/components/meetings/schedule-sheet'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/convex/_generated/api'
import type { MeetingRow } from '@/lib/meeting-types'

export default function MeetingsPage() {
  const meetings = useQuery(api.meeting.list)
  const [createOpen, setCreateOpen] = useState(false)
  const [activeMeeting, setActiveMeeting] = useState<MeetingRow | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const handleViewSchedules = (meeting: MeetingRow) => {
    setActiveMeeting(meeting)
    setSheetOpen(true)
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        icon={<RiCalendarCheckLine />}
        title="Meetings"
        description="Schedule and manage team meetings"
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <RiAddLine />
            Schedule Meeting
          </Button>
        }
      />
      <div className="p-4">
        {meetings === undefined ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : meetings.length === 0 ? (
          <MeetingEmpty />
        ) : (
          <MeetingList
            meetings={meetings}
            onViewSchedules={handleViewSchedules}
          />
        )}
      </div>
      <CreateMeetingDialog open={createOpen} onOpenChange={setCreateOpen} />
      <ScheduleSheet
        meeting={activeMeeting}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  )
}