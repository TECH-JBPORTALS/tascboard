'use client'

import { RiArrowLeftLine } from '@remixicon/react'
import { useMutation } from 'convex/react'
import { useQuery } from 'convex-helpers/react/cache'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { UserAvatar } from '@/components/employees/user-avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { formatMeetingDateTime } from '@/lib/meeting-formatters'
import { RECURRENCE_LABELS } from '@/lib/meeting-types'
import {
  MeetingAttendeesPicker,
  MeetingJoinButton,
  MeetingStatusBadge,
} from './common'

export function ScheduleDetailPage({
  scheduleId,
}: {
  scheduleId: Id<'scheduleMeeting'>
}) {
  const { orgSlug } = useParams<{ orgSlug: string }>()
  const detail = useQuery(api.meeting.getScheduleDetail, {
    scheduleMeetingId: scheduleId,
  })

  if (detail === undefined) {
    return (
      <div className="space-y-4 px-6 py-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (detail === null) {
    return (
      <div className="px-6 py-4">
        <p className="text-sm text-muted-foreground">Meeting not found.</p>
        <Button
          variant="link"
          className="mt-2"
          render={<Link href={`/${orgSlug}/meetings`} />}
        >
          Back to meetings
        </Button>
      </div>
    )
  }

  const { schedule, meeting, attendees, canManage } = detail

  return (
    <div className="space-y-6 px-6 py-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Button
            variant="ghost"
            size={'lg'}
            className="-ml-2.5 gap-1.5"
            render={<Link href={`/${orgSlug}/meetings`} />}
            nativeButton={false}
          >
            <RiArrowLeftLine className="size-4" />
            Back to meetings
          </Button>
          <div className="space-y-1">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              {meeting.title}
            </h1>
            {meeting.description ? (
              <p className="max-w-2xl text-sm text-muted-foreground">
                {meeting.description}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <MeetingStatusBadge
            startTime={schedule.startTime}
            endTime={schedule.endTime}
          />
          {meeting.meetingLink ? (
            <MeetingJoinButton url={meeting.meetingLink} />
          ) : null}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground">When</p>
            <p className="font-medium">
              {formatMeetingDateTime(schedule.startTime, schedule.endTime)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Recurrence</p>
            <p className="font-medium">
              {RECURRENCE_LABELS[meeting.recurrenceType]}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <MeetingNotesEditor
            key={schedule._id + schedule.updatedAt}
            scheduleMeetingId={schedule._id}
            initialNotes={schedule.finalNotes ?? ''}
            canManage={canManage}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Attendees</CardTitle>
        </CardHeader>
        <CardContent>
          <MeetingAttendeesSection
            scheduleMeetingId={schedule._id}
            attendees={attendees}
            canManage={canManage}
          />
        </CardContent>
      </Card>
    </div>
  )
}

// --- Notes ---

function MeetingNotesEditor({
  scheduleMeetingId,
  initialNotes,
  canManage,
}: {
  scheduleMeetingId: Id<'scheduleMeeting'>
  initialNotes: string
  canManage: boolean
}) {
  const [notes, setNotes] = useState(initialNotes)
  const [saving, setSaving] = useState(false)
  const recordNotes = useMutation(api.meeting.recordMeetingNotes)

  const dirty = notes !== initialNotes

  useEffect(() => {
    setNotes(initialNotes)
  }, [initialNotes])

  async function handleSave() {
    setSaving(true)
    try {
      await recordNotes({ scheduleMeetingId, finalNotes: notes })
      toast.success('Notes saved')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to save notes',
      )
    } finally {
      setSaving(false)
    }
  }

  if (!canManage) {
    return (
      <div className="space-y-3">
        <Label>Meeting notes</Label>
        {initialNotes.trim() ? (
          <div className="whitespace-pre-wrap rounded-lg border bg-muted/30 p-4 text-sm">
            {initialNotes}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No notes recorded yet.
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <Label htmlFor="meeting-notes">Meeting notes</Label>
      <Textarea
        id="meeting-notes"
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        placeholder="Capture decisions, action items, and follow-ups..."
        rows={8}
      />
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={() => void handleSave()}
          disabled={!dirty || saving}
        >
          {saving ? 'Saving...' : 'Save notes'}
        </Button>
      </div>
    </div>
  )
}

// --- Attendees section ---

type Attendee = {
  _id: Id<'meetingAttendee'>
  employeeId: string
  name: string
  email: string
  image: string | null
}

function MeetingAttendeesSection({
  scheduleMeetingId,
  attendees,
  canManage,
}: {
  scheduleMeetingId: Id<'scheduleMeeting'>
  attendees: Attendee[]
  canManage: boolean
}) {
  const [adding, setAdding] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const inviteAttendees = useMutation(api.meeting.inviteAttendees)
  const employees = useQuery(api.employees.list)

  const existingIds = useMemo(
    () => new Set(attendees.map((a) => a.employeeId)),
    [attendees],
  )

  const availableToAdd = useMemo(
    () => selectedIds.filter((id) => !existingIds.has(id)),
    [selectedIds, existingIds],
  )

  async function handleAddAttendees() {
    if (availableToAdd.length === 0) return
    try {
      await inviteAttendees({
        scheduleMeetingId,
        employeeIds: availableToAdd,
      })
      toast.success('Attendees added')
      setSelectedIds([])
      setAdding(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to add attendees',
      )
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Label>Attendees ({attendees.length})</Label>
        {canManage ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setAdding((value) => !value)}
          >
            {adding ? 'Cancel' : 'Add attendees'}
          </Button>
        ) : null}
      </div>

      {adding && canManage ? (
        <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
          <MeetingAttendeesPicker
            selectedIds={selectedIds}
            onChange={setSelectedIds}
          />
          <Button
            size="sm"
            onClick={() => void handleAddAttendees()}
            disabled={availableToAdd.length === 0}
          >
            Add selected
          </Button>
        </div>
      ) : null}

      {attendees.length === 0 ? (
        <p className="text-sm text-muted-foreground">No attendees yet.</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {attendees.map((attendee) => (
            <li
              key={attendee._id}
              className="flex items-center gap-3 px-4 py-3 text-sm"
            >
              <UserAvatar
                name={attendee.name}
                imageUrl={attendee.image}
                className="size-8"
              />
              <div className="min-w-0">
                <p className="truncate font-medium">{attendee.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {attendee.email}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {employees === undefined ? null : (
        <p className="text-xs text-muted-foreground">
          Default template invitees are copied to each occurrence automatically.
        </p>
      )}
    </div>
  )
}
