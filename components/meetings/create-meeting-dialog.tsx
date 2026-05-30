'use client'

import { useMutation } from 'convex/react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { api } from '@/convex/_generated/api'
import type { MeetingFormValues } from '@/lib/meeting-types'
import { CreateMeetingForm } from './create-meeting-form'

interface CreateMeetingDialogProps {
  onOpenChange: (open: boolean) => void
  open: boolean
}

const now = Date.now()
const DEFAULT: MeetingFormValues = {
  description: '',
  endTime: now + 60 * 60 * 1000,
  meetingLink: '',
  recurrenceDays: [],
  recurrenceType: 'none',
  recipients: [],
  startTime: now,
  title: '',
}

export function CreateMeetingDialog({
  onOpenChange,
  open,
}: CreateMeetingDialogProps) {
  const [values, setValues] = useState<MeetingFormValues>(DEFAULT)
  const create = useMutation(api.meeting.create)

  const set = <K extends keyof MeetingFormValues>(
    key: K,
    value: MeetingFormValues[K],
  ) => setValues((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = async () => {
    await create({
      description: values.description,
      endTime: values.endTime,
      meetingLink: values.meetingLink,
      recurrenceDays: values.recurrenceDays,
      recurrenceType: values.recurrenceType,
      recipients: values.recipients,
      startTime: values.startTime,
      title: values.title,
    })
    setValues(DEFAULT)
    onOpenChange(false)
  }

  const isValid = values.title.trim() !== '' && values.meetingLink.trim() !== ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Schedule Meeting</DialogTitle>
          <DialogDescription>
            Create a meeting and invite attendees.
          </DialogDescription>
        </DialogHeader>
        <CreateMeetingForm values={values} onChange={set} />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!isValid} onClick={() => void handleSubmit()}>
            Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}