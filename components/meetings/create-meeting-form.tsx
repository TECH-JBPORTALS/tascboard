'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  type MeetingFormValues,
  RECURRENCE_LABELS,
  type RecurrenceDay,
  type RecurrenceType,
} from '@/lib/meeting-types'

import { MeetingAttendeePicker } from './meeting-attendee-picker'
import { MeetingRecurrencePicker } from './meeting-recurrence-picker'
import { MeetingTimeInputs } from './meeting-time-inputs'

interface CreateMeetingFormProps {
  onChange: <K extends keyof MeetingFormValues>(
    key: K,
    value: MeetingFormValues[K],
  ) => void
  values: MeetingFormValues
}

export function CreateMeetingForm({
  onChange,
  values,
}: CreateMeetingFormProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label>Title</Label>
        <Input
          placeholder="Meeting title"
          value={values.title}
          onChange={(e) => onChange('title', e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Description</Label>
        <Textarea
          placeholder="Optional description"
          value={values.description}
          onChange={(e) => onChange('description', e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Meeting Link</Label>
        <Input
          placeholder="https://meet.google.com/..."
          value={values.meetingLink}
          onChange={(e) => onChange('meetingLink', e.target.value)}
        />
      </div>
      <MeetingTimeInputs
        endTime={values.endTime}
        onEndChange={(ts) => onChange('endTime', ts)}
        onStartChange={(ts) => onChange('startTime', ts)}
        startTime={values.startTime}
      />
      <div className="flex flex-col gap-1.5">
        <Label>Recurrence</Label>
        <Select
          value={values.recurrenceType}
          onValueChange={(v) =>
            onChange('recurrenceType', (v ?? 'none') as RecurrenceType)
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(RECURRENCE_LABELS) as RecurrenceType[]).map((k) => (
              <SelectItem key={k} value={k}>
                {RECURRENCE_LABELS[k]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {values.recurrenceType === 'weekly' && (
        <div className="flex flex-col gap-1.5">
          <Label>Recurrence Days</Label>
          <MeetingRecurrencePicker
            selected={values.recurrenceDays}
            onChange={(days) =>
              onChange('recurrenceDays', days as RecurrenceDay[])
            }
          />
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <Label>Attendees</Label>
        <MeetingAttendeePicker
          selected={values.recipients}
          onChange={(ids) => onChange('recipients', ids)}
        />
      </div>
    </div>
  )
}