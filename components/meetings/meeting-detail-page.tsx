'use client'

import { RiArrowLeftLine, RiDeleteBinLine } from '@remixicon/react'
import { useMutation, useQuery } from 'convex/react'
import { useParams, useRouter } from 'next/navigation'
import * as React from 'react'

import { toast } from 'sonner'

import { TitleInput } from '@/components/title-input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import type { RecurrenceDay, RecurrenceType } from '@/lib/meeting-types'

import { MeetingAttendanceDialog } from './meeting-attendance-dialog'
import { MeetingAttendeePicker } from './meeting-attendee-picker'
import { MeetingDetailNotes } from './meeting-detail-notes'
import { MeetingDetailProperties } from './meeting-detail-properties'

export function MeetingDetailPage() {
  const { orgSlug, meetingId } = useParams<{
    orgSlug: string
    meetingId: string
  }>()
  const router = useRouter()

  // ── all hooks first ──
  const meeting = useQuery(api.meeting.get, {
    meetingId: meetingId as Id<'meeting'>,
  })
  const recipients = useQuery(api.meeting.getRecipients, {
    meetingId: meetingId as Id<'meeting'>,
  })
  const schedules = useQuery(api.meeting.getSchedules, {
    meetingId: meetingId as Id<'meeting'>,
  })
  const employees = useQuery(api.employees.list)
  const removeMeeting = useMutation(api.meeting.remove)
  const updateMeeting = useMutation(api.meeting.update)
  const recordNotes = useMutation(api.meeting.recordMeetingNotes)

  const [attendanceOpen, setAttendanceOpen] = React.useState(false)
  const [notes, setNotes] = React.useState('')
  const [notesSaving, setNotesSaving] = React.useState(false)
  const [selectedAttendees, setSelectedAttendees] = React.useState<string[]>([])

  const empMap = React.useMemo(() => {
    const m = new Map<
      string,
      { name: string; image: string | null; role?: string }
    >()
    for (const e of employees ?? []) {
      m.set(e.id, {
        name: e.user?.name ?? e.user?.email ?? 'Unknown',
        image: e.user?.image ?? null,
        role: e.role,
      })
    }
    return m
  }, [employees])

  const latest = schedules?.[schedules.length - 1]
  const latestId = latest?._id ?? null

  React.useEffect(() => {
    const n = latest?.finalNotes
    if (n) setNotes(n)
  }, [latest?.finalNotes])

  React.useEffect(() => {
    if (recipients) {
      setSelectedAttendees(recipients.map((r) => r.employeeId))
    }
  }, [recipients])

  // ── early returns AFTER all hooks ──
  if (meeting === undefined) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Loading...
      </div>
    )
  }

  if (meeting === null) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Meeting not found.
      </div>
    )
  }

  // ── handlers ──
  const handleSaveTitle = async (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return
    try {
      await updateMeeting({
        meetingId: meetingId as Id<'meeting'>,
        body: { title: trimmed },
      })
    } catch {
      toast.error('Failed to save title')
    }
  }

  const handleSaveDescription = async (value: string) => {
    const trimmed = value.trim()
    try {
      await updateMeeting({
        meetingId: meetingId as Id<'meeting'>,
        body: { description: trimmed.length > 0 ? trimmed : undefined },
      })
    } catch {
      toast.error('Failed to save description')
    }
  }

  const handleStartTimeChange = async (ts: number) => {
    try {
      await updateMeeting({
        meetingId: meetingId as Id<'meeting'>,
        body: { startTime: ts },
      })
    } catch {
      toast.error('Failed to save start time')
    }
  }

  const handleEndTimeChange = async (ts: number) => {
    try {
      await updateMeeting({
        meetingId: meetingId as Id<'meeting'>,
        body: { endTime: ts },
      })
    } catch {
      toast.error('Failed to save end time')
    }
  }

  const handleRecurrenceTypeChange = async (type: RecurrenceType) => {
    try {
      await updateMeeting({
        meetingId: meetingId as Id<'meeting'>,
        body: { recurrenceType: type },
      })
    } catch {
      toast.error('Failed to save recurrence')
    }
  }

  const handleRecurrenceDaysChange = async (days: RecurrenceDay[]) => {
    try {
      await updateMeeting({
        meetingId: meetingId as Id<'meeting'>,
        body: { recurrenceDays: days },
      })
    } catch {
      toast.error('Failed to save recurrence days')
    }
  }

  const handleDelete = async () => {
    try {
      await removeMeeting({ meetingId: meetingId as Id<'meeting'> })
      toast.success('Meeting deleted')
      router.push(`/${orgSlug}/meetings`)
    } catch {
      toast.error('Failed to delete meeting')
    }
  }

  const handleSaveNotes = async () => {
    if (!latestId) {
      toast.error('No scheduled session found')
      return
    }
    setNotesSaving(true)
    try {
      await recordNotes({
        scheduleMeetingId: latestId as Id<'scheduleMeeting'>,
        finalNotes: notes,
      })
      toast.success('Notes saved')
    } catch {
      toast.error('Failed to save notes')
    } finally {
      setNotesSaving(false)
    }
  }

  const toggleAttendee = (id: string) => {
    setSelectedAttendees((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id],
    )
  }

  return (
    <>
      {/* Header */}
      <div className="sticky top-0 z-10 flex h-[var(--header-height)] shrink-0 items-center gap-3 border-b border-border bg-sidebar px-4 backdrop-blur supports-backdrop-filter:bg-sidebar/80">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground"
          onClick={() => router.push(`/${orgSlug}/meetings`)}
        >
          <RiArrowLeftLine className="size-3.5" />
          Meetings
        </Button>
        <span className="text-muted-foreground/40">/</span>
        <span className="truncate text-sm font-medium">{meeting.title}</span>
        <div className="ml-auto">
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={handleDelete}
          >
            <RiDeleteBinLine className="mr-1.5 size-3.5" />
            Delete
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
          <TitleInput
            value={meeting.title}
            placeholder="Meeting title"
            onSave={handleSaveTitle}
            aria-label="Meeting title"
          />

          <TitleInput
            value={meeting.description ?? ''}
            placeholder="Add a description..."
            onSave={handleSaveDescription}
            className="text-sm! font-normal! pb-0!"
            aria-label="Meeting description"
          />

          <MeetingDetailProperties
            startTime={meeting.startTime}
            endTime={meeting.endTime}
            meetingLink={meeting.meetingLink}
            hasSchedule={!!latestId}
            createdAt={meeting.createdAt}
            recurrenceType={meeting.recurrenceType}
            recurrenceDays={(meeting.recurrenceDays ?? []) as RecurrenceDay[]}
            onTrackAttendance={() => setAttendanceOpen(true)}
            onStartTimeChange={handleStartTimeChange}
            onEndTimeChange={handleEndTimeChange}
            onRecurrenceTypeChange={handleRecurrenceTypeChange}
            onRecurrenceDaysChange={handleRecurrenceDaysChange}
          />

          <div className="space-y-3">
            <h2 className="text-sm font-semibold">Attendees</h2>
            <MeetingAttendeePicker
              selected={selectedAttendees}
              onToggle={toggleAttendee}
            />
            {selectedAttendees.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {selectedAttendees.map((id) => {
                  const e = empMap.get(id)
                  return (
                    <div
                      key={id}
                      className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-xs"
                    >
                      <span className="font-medium">{e?.name ?? id}</span>
                      {e?.role && (
                        <span className="text-muted-foreground">{e.role}</span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <MeetingDetailNotes
            notes={notes}
            onChange={setNotes}
            onSave={handleSaveNotes}
            saving={notesSaving}
            hasSchedule={!!latestId}
          />
        </div>
      </ScrollArea>

      <MeetingAttendanceDialog
        scheduleMeetingId={attendanceOpen ? latestId : null}
        meetingId={attendanceOpen ? meetingId : null}
        onClose={() => setAttendanceOpen(false)}
      />
    </>
  )
}
