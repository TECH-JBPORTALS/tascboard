'use client'

import { useMutation, useQuery } from 'convex/react'
import { format } from 'date-fns'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { ScheduleAttendance } from './schedule-attendance'

interface ScheduleListProps {
  meetingId: Id<'meeting'>
}

export function ScheduleList({ meetingId }: ScheduleListProps) {
  const schedules = useQuery(api.meeting.getSchedules, { meetingId })
  const recordNotes = useMutation(api.meeting.recordMeetingNotes)
  const [editingId, setEditingId] = useState<Id<'scheduleMeeting'> | null>(null)
  const [notes, setNotes] = useState('')

  if (!schedules) return <Skeleton className="h-20 w-full" />
  if (schedules.length === 0) {
    return <p className="text-xs text-muted-foreground">No occurrences yet.</p>
  }

  return (
    <div className="flex flex-col gap-4">
      {schedules.map((s) => (
        <div key={s._id} className="flex flex-col gap-2 rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {format(new Date(s.startTime), 'PPp')}
            </span>
            <Badge variant="outline">
              {format(new Date(s.endTime), 'p')}
            </Badge>
          </div>
          <Separator />
          <ScheduleAttendance scheduleMeetingId={s._id} />
          <Separator />
          {editingId === s._id ? (
            <div className="flex flex-col gap-2">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Meeting notes..."
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    void recordNotes({ scheduleMeetingId: s._id, finalNotes: notes })
                    setEditingId(null)
                  }}
                >
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <p className="text-xs text-muted-foreground">
                {s.finalNotes || 'No notes recorded.'}
              </p>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => { setEditingId(s._id); setNotes(s.finalNotes ?? '') }}
              >
                Edit Notes
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}