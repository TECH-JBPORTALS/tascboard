'use client'

import { useMutation } from 'convex/react'
import * as React from 'react'
import { toast } from 'sonner'
import { api } from '@/convex/_generated/api'
import { defaultFormValues, type MeetingFormValues } from '@/lib/meeting-types'
import { Button } from '../ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { ScrollArea } from '../ui/scroll-area'
import { CreateMeetingForm } from './create-meeting-form'

interface CreateMeetingDialogProps {
  open: boolean
  onClose: () => void
}

export function CreateMeetingDialog({
  open,
  onClose,
}: CreateMeetingDialogProps) {
  const createMeeting = useMutation(api.meeting.create)
  const [values, setValues] =
    React.useState<MeetingFormValues>(defaultFormValues)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (open) setValues(defaultFormValues())
  }, [open])

  const handleChange = <K extends keyof MeetingFormValues>(
    key: K,
    value: MeetingFormValues[K],
  ) => setValues((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = async () => {
    if (!values.title.trim()) {
      toast.error('Meeting title is required')
      return
    }
    if (values.recipients.length === 0) {
      toast.error('Add at least one attendee')
      return
    }
    if (
      values.recurrenceType === 'weekly' &&
      values.recurrenceDays.length === 0
    ) {
      toast.error('Select at least one day for weekly recurrence')
      return
    }
    setLoading(true)
    try {
      await createMeeting({
        title: values.title,
        description: values.description || undefined,
        meetingLink: values.meetingLink,
        recurrenceType: values.recurrenceType,
        recurrenceDays: values.recurrenceDays,
        startTime: values.startTime,
        endTime: values.endTime,
        recipients: values.recipients,
      })
      toast.success('Meeting scheduled')
      onClose()
    } catch {
      toast.error('Failed to create meeting')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4">
          <DialogTitle>Schedule Meeting</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1">
          <div className="px-6 py-4">
            <CreateMeetingForm values={values} onChange={handleChange} />
          </div>
        </ScrollArea>
        <DialogFooter className="shrink-0 border-t border-border px-6 py-4">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Scheduling...' : 'Schedule Meeting'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
