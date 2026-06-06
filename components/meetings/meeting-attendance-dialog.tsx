'use client'

import { useMutation, useQuery } from 'convex/react'
import * as React from 'react'
import { toast } from 'sonner'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { UserAvatar } from '../employees/user-avatar'
import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Skeleton } from '../ui/skeleton'

interface MeetingAttendanceDialogProps {
  scheduleMeetingId: string | null
  meetingId: string | null
  onClose: () => void
}

export function MeetingAttendanceDialog({
  scheduleMeetingId,
  meetingId,
  onClose,
}: MeetingAttendanceDialogProps) {
  const recipients = useQuery(
    api.meeting.getRecipients,
    meetingId ? { meetingId: meetingId as Id<'meeting'> } : 'skip',
  )
  const existingAttendees = useQuery(
    api.meeting.trackMeetingAttendance,
    scheduleMeetingId
      ? { scheduleMeetingId: scheduleMeetingId as Id<'scheduleMeeting'> }
      : 'skip',
  )
  const inviteAttendees = useMutation(api.meeting.inviteAttendees)
  const employees = useQuery(api.employees.list)

  const [selected, setSelected] = React.useState<string[]>([])
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (existingAttendees) {
      setSelected(existingAttendees.map((a) => a.employeeId))
    }
  }, [existingAttendees])

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const handleSave = async () => {
    if (!scheduleMeetingId) return
    setLoading(true)
    try {
      await inviteAttendees({
        scheduleMeetingId: scheduleMeetingId as Id<'scheduleMeeting'>,
        employeeIds: selected,
      })
      toast.success('Attendance recorded')
      onClose()
    } catch {
      toast.error('Failed to record attendance')
    } finally {
      setLoading(false)
    }
  }

  const recipientIds = recipients?.map((r) => r.employeeId) ?? []

  const employeeMap = React.useMemo(() => {
    const map = new Map<string, { name: string; image?: string | null }>()
    if (!employees) return map
    for (const emp of employees) {
      map.set(emp.id, {
        name: emp.user?.name ?? emp.user?.email ?? 'Unknown',
        image: emp.user?.image ?? null,
      })
    }
    return map
  }, [employees])

  return (
    <Dialog open={!!scheduleMeetingId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className='max-w-sm'>
        <DialogHeader>
          <DialogTitle>Track Attendance</DialogTitle>
        </DialogHeader>
        <div className='flex flex-col gap-1 py-1'>
          {!recipients || !employees ? (
            <div className='flex flex-col gap-2'>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className='h-10 w-full' />
              ))}
            </div>
          ) : recipientIds.length === 0 ? (
            <p className='py-4 text-center text-sm text-muted-foreground'>
              No attendees invited to this meeting
            </p>
          ) : (
            recipientIds.map((id) => {
              const emp = employeeMap.get(id)
              const name = emp?.name ?? 'Unknown'
              return (
                <label
                  key={id}
                  className='flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/40'
                >
                  <Checkbox
                    checked={selected.includes(id)}
                    onCheckedChange={() => toggle(id)}
                  />
                  <UserAvatar
                    name={name}
                    imageUrl={emp?.image}
                    className='size-7 shrink-0'
                  />
                  <span className='text-sm'>{name}</span>
                </label>
              )
            })
          )}
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Attendance'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}