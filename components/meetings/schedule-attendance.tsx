'use client'

import { useQuery } from 'convex/react'
import { UserAvatar } from '@/components/employees/user-avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'

interface ScheduleAttendanceProps {
  scheduleMeetingId: Id<'scheduleMeeting'>
}

export function ScheduleAttendance({
  scheduleMeetingId,
}: ScheduleAttendanceProps) {
  const attendees = useQuery(api.meeting.trackMeetingAttendance, {
    scheduleMeetingId,
  })
  const employees = useQuery(api.employees.auth.list)

  if (!attendees || !employees) {
    return <Skeleton className="h-8 w-full" />
  }

  if (attendees.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">No attendees recorded.</p>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      {attendees.map((a) => {
        const emp = employees.find((e) => e.id === a.employeeId)
        if (!emp) return null
        return (
          <div key={a._id} className="flex items-center gap-2">
            <UserAvatar name={emp.name} imageUrl={emp.image} className="size-5" />
            <span className="text-sm">{emp.name}</span>
            <Badge variant="secondary" className="ml-auto capitalize">
              {emp.role}
            </Badge>
          </div>
        )
      })}
    </div>
  )
}