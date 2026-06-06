'use client'

import { useMutation, useQuery } from 'convex/react'
import * as React from 'react'
import { toast } from 'sonner'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { type MeetingFormValues } from '@/lib/meeting-types'
import { Button } from '../ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { CreateMeetingForm } from './create-meeting-form'

interface EditMeetingDialogProps {
  meetingId: string | null
  onClose: () => void
}

export function EditMeetingDialog({
  meetingId,
  onClose,
}: EditMeetingDialogProps) {
  const meeting = useQuery(
    api.meeting.get,
    meetingId ? { meetingId: meetingId as Id<'meeting'> } : 'skip',
  )
  const recipients = useQuery(
    api.meeting.getRecipients,
    meetingId ? { meetingId: meetingId as Id<'meeting'> } : 'skip',
  )
  const updateMeeting = useMutation(api.meeting.update)

  const [values, setValues] = React.useState<MeetingFormValues | null>(null)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (meeting && recipients) {
      setValues({
        title: meeting.title,
        description: meeting.description ?? '',
        meetingLink: meeting.meetingLink,
        recurrenceType: meeting.recurrenceType,
        recurrenceDays:
          meeting.recurrenceDays as MeetingFormValues['recurrenceDays'],
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        recipients: recipients.map((r) => r.employeeId),
      })
    }
  }, [meeting, recipients])

  const handleChange = <K extends keyof MeetingFormValues>(
    key: K,
    value: MeetingFormValues[K],
  ) => {
    setValues((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  const handleSubmit = async () => {
    if (!meetingId || !values) return
    if (!values.title.trim()) {
      toast.error('Meeting title is required')
      return
    }
    setLoading(true)
    try {
      await updateMeeting({
        meetingId: meetingId as Id<'meeting'>,
        body: {
          title: values.title,
          description: values.description || undefined,
          meetingLink: values.meetingLink,
          recurrenceType: values.recurrenceType,
          recurrenceDays: values.recurrenceDays,
          startTime: values.startTime,
          endTime: values.endTime,
        },
      })
      toast.success('Meeting updated')
      onClose()
    } catch {
      toast.error('Failed to update meeting')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={!!meetingId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Meeting</DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto py-1 pr-1">
          {values ? (
            <CreateMeetingForm values={values} onChange={handleChange} />
          ) : (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              Loading...
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !values}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
