'use client'

import { RiAddLine, RiCalendarLine, RiSearchLine } from '@remixicon/react'
import { useQuery } from 'convex/react'
import * as React from 'react'
import { api } from '@/convex/_generated/api'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { PageHeader } from '../ui/page-header'
import { CreateMeetingDialog } from './create-meeting-dialog'
import { MeetingListTable } from './meeting-list-table'
import { useMeetingState } from './use-meeting-state'

export function MeetingPage() {
  const meetings = useQuery(api.meeting.list)
  const [search, setSearch] = React.useState('')
  const state = useMeetingState()

  return (
    <div className='flex flex-1 flex-col'>
      <PageHeader
        icon={<RiCalendarLine />}
        title='Meetings'
        actions={
          <div className='flex items-center gap-2'>
            <div className='relative'>
              <RiSearchLine className='absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground' />
              <Input
                className='h-8 w-44 pl-8 text-sm'
                placeholder='Search meetings...'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button size='sm' onClick={state.openCreate}>
              <RiAddLine className='mr-1.5 size-3.5' />
              New Meeting
            </Button>
          </div>
        }
      />

      {/* Cards */}
      <div className='flex-1 overflow-auto p-4'>
        <MeetingListTable
          meetings={meetings}
          search={search}
        />
      </div>

      <CreateMeetingDialog open={state.createOpen} onClose={state.closeCreate} />
    </div>
  )
}