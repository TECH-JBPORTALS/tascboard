'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import {
  RiAddLine,
  RiCalendarCloseLine,
  RiDeleteBinLine,
  RiMore2Line,
  RiPenNibLine,
  RiTriangleFill,
  RiVideoChatLine,
} from '@remixicon/react'
import { useMutation } from 'convex/react'
import { useQuery } from 'convex-helpers/react/cache'
import { format, isSameDay, startOfDay } from 'date-fns'
import { isEmpty } from 'lodash'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Protect } from '@/components/auth/protect'
import { TimeSelect } from '@/components/common/time-select'
import { UserAvatar } from '@/components/employees/user-avatar'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { AvatarGroup, AvatarGroupCount } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty'
import { Field, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/ui/page-header'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { api } from '@/convex/_generated/api'
import type { Doc } from '@/convex/_generated/dataModel'
import { usePermission } from '@/hooks/use-permission'
import { authClient } from '@/lib/auth-client'
import { toCalendarDateKey } from '@/lib/calendar-date'
import {
  type MeetingFormInput,
  meetingFormSchema,
  meetingTimesToTimestamps,
  timestampsToMeetingTimes,
} from '@/lib/meeting-form-schema'
import {
  ALL_DAYS,
  defaultFormValues,
  getMeetingStatus,
  RECURRENCE_DAY_LABELS,
  RECURRENCE_LABELS,
  type RecurrenceDay,
  type RecurrenceType,
} from '@/lib/meeting-types'
import { cn } from '@/lib/utils'
import { Badge } from '../ui/badge'
import {
  MeetingAttendeesPicker,
  MeetingJoinButton,
  MeetingStatusBadge,
} from './common'

export function MeetingsList() {
  const occurrences = useQuery(api.meeting.listOccurrences, {})
  const { data: session } = authClient.useSession()
  const { allowed: isOwner } = usePermission({ organization: ['delete'] })

  const canManageMeeting = useMemo(
    () => (meeting: { createdBy: string }) =>
      isOwner || meeting.createdBy === session?.user.id,
    [isOwner, session?.user.id],
  )

  if (occurrences === undefined) {
    return (
      <div className="space-y-6 px-6 py-4">
        {[0, 1].map((section) => (
          <div key={section} className="space-y-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        ))}
      </div>
    )
  }

  if (isEmpty(occurrences)) {
    return (
      <div className="px-6 py-4">
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No meetings scheduled</EmptyTitle>
            <EmptyDescription>
              {isOwner
                ? 'Schedule a meeting to see upcoming occurrences here.'
                : 'No meetings assigned to you yet.'}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    )
  }

  return (
    <div className="px-6 py-4">
      <MeetingScheduleList
        occurrences={occurrences}
        canManageMeeting={canManageMeeting}
      />
    </div>
  )
}

export function MeetingsHeader() {
  return (
    <PageHeader
      icon={<RiVideoChatLine />}
      title="Meetings"
      description="Schedule, track, and take notes for team meetings"
      actions={
        <Protect permissions={{ organization: ['delete'] }}>
          <CreateMeetingDialog />
        </Protect>
      }
    />
  )
}

// --- Schedule grouping helpers ---

type ScheduleOccurrence = {
  schedule: { startTime: number; endTime: number; _id: string }
}

type ScheduleDayGroup<T extends ScheduleOccurrence> = {
  dayKey: string
  label: string
  items: T[]
}

function formatScheduleTime(timestamp: number) {
  return format(timestamp, 'h:mm a')
}

function getScheduleDayKey(timestamp: number) {
  return toCalendarDateKey(timestamp)
}

function getScheduleDayLabel(timestamp: number, now = Date.now()) {
  const date = new Date(timestamp)
  const today = new Date(now)

  if (isSameDay(date, today)) {
    return 'Today'
  }

  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  if (isSameDay(date, tomorrow)) {
    return 'Tomorrow'
  }

  return format(date, 'EEEE, MMMM d')
}

function partitionOccurrences<T extends ScheduleOccurrence>(
  occurrences: T[],
  now = Date.now(),
) {
  const upcoming: T[] = []
  const past: T[] = []

  for (const occurrence of occurrences) {
    if (occurrence.schedule.endTime >= now) {
      upcoming.push(occurrence)
    } else {
      past.push(occurrence)
    }
  }

  return { upcoming, past }
}

function groupOccurrencesByDay<T extends ScheduleOccurrence>(
  occurrences: T[],
  now = Date.now(),
): ScheduleDayGroup<T>[] {
  const groups = new Map<string, ScheduleDayGroup<T>>()

  for (const occurrence of occurrences) {
    const dayKey = getScheduleDayKey(occurrence.schedule.startTime)
    const existing = groups.get(dayKey)

    if (existing) {
      existing.items.push(occurrence)
      continue
    }

    groups.set(dayKey, {
      dayKey,
      label: getScheduleDayLabel(occurrence.schedule.startTime, now),
      items: [occurrence],
    })
  }

  return [...groups.values()].sort(
    (a, b) =>
      startOfDay(new Date(a.items[0]!.schedule.startTime)).getTime() -
      startOfDay(new Date(b.items[0]!.schedule.startTime)).getTime(),
  )
}

// --- Attendee avatars ---

type MeetingAttendeePreview = {
  employeeId: string
  name: string
  image: string | null
}

function MeetingAttendeeAvatars({
  attendees,
  maxVisible = 4,
}: {
  attendees: MeetingAttendeePreview[]
  maxVisible?: number
}) {
  if (attendees.length === 0) {
    return null
  }

  const visible = attendees.slice(0, maxVisible)
  const overflow = attendees.length - visible.length
  const allNames = attendees.map((attendee) => attendee.name).join(', ')

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <AvatarGroup className="shrink-0 *:data-[slot=avatar]:size-7" />
        }
      >
        {visible.map((attendee) => (
          <UserAvatar
            key={attendee.employeeId}
            name={attendee.name}
            imageUrl={attendee.image}
            size="sm"
          />
        ))}
        {overflow > 0 ? <AvatarGroupCount>+{overflow}</AvatarGroupCount> : null}
      </TooltipTrigger>
      <TooltipContent side="top">{allNames}</TooltipContent>
    </Tooltip>
  )
}

// --- Edit meeting dialog ---

function toggleRecurrenceDay(days: RecurrenceDay[], day: RecurrenceDay) {
  return days.includes(day) ? days.filter((d) => d !== day) : [...days, day]
}

function EditMeetingDialog({
  meeting,
  open,
  onOpenChange,
}: {
  meeting: Doc<'meeting'>
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const updateMeeting = useMutation(api.meeting.update)
  const recipients = useQuery(api.meeting.getRecipients, {
    meetingId: meeting._id,
  })

  const meetingTimes = timestampsToMeetingTimes(
    meeting.startTime,
    meeting.endTime,
  )

  const form = useForm<MeetingFormInput>({
    resolver: zodResolver(meetingFormSchema),
    defaultValues: {
      title: meeting.title,
      description: meeting.description ?? '',
      meetingLink: meeting.meetingLink,
      recurrenceType: meeting.recurrenceType,
      recurrenceDays: meeting.recurrenceDays,
      startTime: meetingTimes.startTime,
      endTime: meetingTimes.endTime,
      recipients: [],
    },
  })

  useEffect(() => {
    if (!open) return
    const times = timestampsToMeetingTimes(meeting.startTime, meeting.endTime)
    form.reset({
      title: meeting.title,
      description: meeting.description ?? '',
      meetingLink: meeting.meetingLink,
      recurrenceType: meeting.recurrenceType,
      recurrenceDays: meeting.recurrenceDays,
      startTime: times.startTime,
      endTime: times.endTime,
      recipients: recipients?.map((r) => r.employeeId) ?? [],
    })
  }, [open, meeting, recipients, form])

  async function onSubmit(values: MeetingFormInput) {
    try {
      const referenceDate = new Date(meeting.startTime)
      const { startTimestamp, endTimestamp } = meetingTimesToTimestamps(
        values.startTime,
        values.endTime,
        referenceDate,
      )

      await updateMeeting({
        meetingId: meeting._id,
        body: {
          title: values.title,
          description: values.description || undefined,
          meetingLink: values.meetingLink,
          recurrenceType: values.recurrenceType,
          recurrenceDays: values.recurrenceDays,
          startTime: startTimestamp,
          endTime: endTimestamp,
        },
        recipients: values.recipients,
      })
      toast.success('Meeting updated')
      onOpenChange(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update meeting',
      )
    }
  }

  const recurrenceType = form.watch('recurrenceType')
  const recurrenceDays = form.watch('recurrenceDays')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit meeting</DialogTitle>
          <DialogDescription>
            Update the meeting template and default invite list.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(onSubmit)}
          id={`edit-meeting-form-${meeting._id}`}
        >
          <Controller
            name="title"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <Label htmlFor={`edit-title-${meeting._id}`}>Title</Label>
                <Input id={`edit-title-${meeting._id}`} {...field} />
                {fieldState.error ? (
                  <FieldError errors={[fieldState.error]} />
                ) : null}
              </Field>
            )}
          />

          <Controller
            name="description"
            control={form.control}
            render={({ field }) => (
              <Field>
                <Label htmlFor={`edit-description-${meeting._id}`}>
                  Description
                </Label>
                <Textarea
                  id={`edit-description-${meeting._id}`}
                  rows={3}
                  {...field}
                />
              </Field>
            )}
          />

          <Controller
            name="meetingLink"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <Label htmlFor={`edit-link-${meeting._id}`}>Meeting link</Label>
                <Input id={`edit-link-${meeting._id}`} {...field} />
                {fieldState.error ? (
                  <FieldError errors={[fieldState.error]} />
                ) : null}
              </Field>
            )}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Controller
              name="startTime"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <Label htmlFor={`edit-start-${meeting._id}`}>Start</Label>
                  <TimeSelect
                    id={`edit-start-${meeting._id}`}
                    value={field.value}
                    onChange={field.onChange}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.error ? (
                    <FieldError errors={[fieldState.error]} />
                  ) : null}
                </Field>
              )}
            />
            <Controller
              name="endTime"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <Label htmlFor={`edit-end-${meeting._id}`}>End</Label>
                  <TimeSelect
                    id={`edit-end-${meeting._id}`}
                    value={field.value}
                    onChange={field.onChange}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.error ? (
                    <FieldError errors={[fieldState.error]} />
                  ) : null}
                </Field>
              )}
            />
          </div>

          <Controller
            name="recurrenceType"
            control={form.control}
            render={({ field }) => (
              <Field>
                <Label>Recurrence</Label>
                <Select
                  value={field.value}
                  onValueChange={(value) =>
                    field.onChange(value as RecurrenceType)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(RECURRENCE_LABELS) as RecurrenceType[]).map(
                      (type) => (
                        <SelectItem key={type} value={type}>
                          {RECURRENCE_LABELS[type]}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </Field>
            )}
          />

          {recurrenceType === 'weekly' ? (
            <Field>
              <Label>Repeat on</Label>
              <div className="flex flex-wrap gap-2">
                {ALL_DAYS.map((day) => {
                  const selected = recurrenceDays.includes(day)
                  return (
                    <Button
                      key={day}
                      type="button"
                      size="sm"
                      variant={selected ? 'default' : 'outline'}
                      onClick={() =>
                        form.setValue(
                          'recurrenceDays',
                          toggleRecurrenceDay(recurrenceDays, day),
                          { shouldValidate: true },
                        )
                      }
                    >
                      {RECURRENCE_DAY_LABELS[day]}
                    </Button>
                  )
                })}
              </div>
            </Field>
          ) : null}

          <Controller
            name="recipients"
            control={form.control}
            render={({ field }) => (
              <Field>
                <Label>Default attendees</Label>
                <MeetingAttendeesPicker
                  selectedIds={field.value}
                  onChange={field.onChange}
                />
              </Field>
            )}
          />
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form={`edit-meeting-form-${meeting._id}`}
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? 'Saving...' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// --- Row actions ---

function MeetingRowActions({
  meeting,
  schedule,
}: {
  meeting: Doc<'meeting'>
  schedule: Doc<'scheduleMeeting'>
}) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteMeetingOpen, setDeleteMeetingOpen] = useState(false)
  const [cancelOccurrenceOpen, setCancelOccurrenceOpen] = useState(false)
  const removeMeeting = useMutation(api.meeting.remove)
  const cancelSchedule = useMutation(api.meeting.cancelSchedule)

  async function handleDeleteMeeting() {
    try {
      await removeMeeting({ meetingId: meeting._id })
      toast.success('Meeting deleted')
      setDeleteMeetingOpen(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete meeting',
      )
    }
  }

  async function handleCancelOccurrence() {
    try {
      await cancelSchedule({ scheduleMeetingId: schedule._id })
      toast.success('Occurrence cancelled')
      setCancelOccurrenceOpen(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to cancel occurrence',
      )
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Meeting actions"
            />
          }
        >
          <RiMore2Line className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className={'w-fit'}>
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <RiPenNibLine className="size-4" />
            Edit meeting
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setCancelOccurrenceOpen(true)}>
            <RiCalendarCloseLine />
            Cancel schedule
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setDeleteMeetingOpen(true)}
          >
            <RiDeleteBinLine className="size-4" />
            Delete meeting
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditMeetingDialog
        meeting={meeting}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <AlertDialog open={deleteMeetingOpen} onOpenChange={setDeleteMeetingOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete meeting?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the meeting template, all scheduled occurrences, and
              attendee records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleDeleteMeeting()}>
              Delete meeting
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={cancelOccurrenceOpen}
        onOpenChange={setCancelOccurrenceOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this occurrence?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes only this scheduled occurrence. The meeting template
              and other occurrences will remain.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep occurrence</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleCancelOccurrence()}>
              Cancel occurrence
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// --- Create meeting dialog ---

function CreateMeetingDialog() {
  const [open, setOpen] = useState(false)
  const createMeeting = useMutation(api.meeting.create)
  const defaults = defaultFormValues()
  const defaultTimes = timestampsToMeetingTimes(
    defaults.startTime,
    defaults.endTime,
  )

  const form = useForm<MeetingFormInput>({
    resolver: zodResolver(meetingFormSchema),
    defaultValues: {
      title: defaults.title,
      description: defaults.description,
      meetingLink: defaults.meetingLink,
      recurrenceType: defaults.recurrenceType,
      recurrenceDays: defaults.recurrenceDays,
      startTime: defaultTimes.startTime,
      endTime: defaultTimes.endTime,
      recipients: defaults.recipients,
    },
  })

  async function onSubmit(values: MeetingFormInput) {
    try {
      const { startTimestamp, endTimestamp } = meetingTimesToTimestamps(
        values.startTime,
        values.endTime,
      )

      await createMeeting({
        title: values.title,
        description: values.description || undefined,
        meetingLink: values.meetingLink,
        recurrenceType: values.recurrenceType,
        recurrenceDays: values.recurrenceDays,
        startTime: startTimestamp,
        endTime: endTimestamp,
        recipients: values.recipients,
      })
      toast.success('Meeting scheduled')
      form.reset()
      setOpen(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to create meeting',
      )
    }
  }

  const recurrenceType = form.watch('recurrenceType')
  const recurrenceDays = form.watch('recurrenceDays')

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm">
            <RiAddLine className="size-4" />
            Schedule meeting
          </Button>
        }
      />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Schedule meeting</DialogTitle>
          <DialogDescription>
            Create a meeting and invite team members. Recurring meetings
            generate upcoming occurrences automatically.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(onSubmit)}
          id="create-meeting-form"
        >
          <Controller
            name="title"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <Label htmlFor="meeting-title">Title</Label>
                <Input
                  id="meeting-title"
                  placeholder="Weekly sync"
                  {...field}
                />
                {fieldState.error ? (
                  <FieldError errors={[fieldState.error]} />
                ) : null}
              </Field>
            )}
          />

          <Controller
            name="description"
            control={form.control}
            render={({ field }) => (
              <Field>
                <Label htmlFor="meeting-description">Description</Label>
                <Textarea
                  id="meeting-description"
                  placeholder="Optional agenda or context"
                  rows={3}
                  {...field}
                />
              </Field>
            )}
          />

          <Controller
            name="meetingLink"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <Label htmlFor="meeting-link">Meeting link</Label>
                <Input
                  id="meeting-link"
                  placeholder="https://meet.google.com/..."
                  {...field}
                />
                {fieldState.error ? (
                  <FieldError errors={[fieldState.error]} />
                ) : null}
              </Field>
            )}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Controller
              name="startTime"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <Label htmlFor="meeting-start">Start</Label>
                  <TimeSelect
                    id="meeting-start"
                    value={field.value}
                    onChange={field.onChange}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.error ? (
                    <FieldError errors={[fieldState.error]} />
                  ) : null}
                </Field>
              )}
            />
            <Controller
              name="endTime"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <Label htmlFor="meeting-end">End</Label>
                  <TimeSelect
                    id="meeting-end"
                    value={field.value}
                    onChange={field.onChange}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.error ? (
                    <FieldError errors={[fieldState.error]} />
                  ) : null}
                </Field>
              )}
            />
          </div>

          <Controller
            name="recurrenceType"
            control={form.control}
            render={({ field }) => (
              <Field>
                <Label>Recurrence</Label>
                <Select
                  value={field.value}
                  onValueChange={(value) =>
                    field.onChange(value as RecurrenceType)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(RECURRENCE_LABELS) as RecurrenceType[]).map(
                      (type) => (
                        <SelectItem key={type} value={type}>
                          {RECURRENCE_LABELS[type]}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </Field>
            )}
          />

          {recurrenceType === 'weekly' ? (
            <Field>
              <Label>Repeat on</Label>
              <div className="flex flex-wrap gap-2">
                {ALL_DAYS.map((day) => {
                  const selected = recurrenceDays.includes(day)
                  return (
                    <Button
                      key={day}
                      type="button"
                      size="sm"
                      variant={selected ? 'default' : 'outline'}
                      onClick={() =>
                        form.setValue(
                          'recurrenceDays',
                          toggleRecurrenceDay(recurrenceDays, day),
                          { shouldValidate: true },
                        )
                      }
                    >
                      {RECURRENCE_DAY_LABELS[day]}
                    </Button>
                  )
                })}
              </div>
              {form.formState.errors.recurrenceDays ? (
                <FieldError errors={[form.formState.errors.recurrenceDays]} />
              ) : null}
            </Field>
          ) : null}

          <Controller
            name="recipients"
            control={form.control}
            render={({ field }) => (
              <Field>
                <Label>Attendees</Label>
                <MeetingAttendeesPicker
                  selectedIds={field.value}
                  onChange={field.onChange}
                />
              </Field>
            )}
          />
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-meeting-form"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? 'Scheduling...' : 'Schedule meeting'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// --- Schedule cards ---

type MeetingOccurrenceRow = {
  schedule: Doc<'scheduleMeeting'>
  meeting: Doc<'meeting'>
  attendeeCount: number
  attendees: MeetingAttendeePreview[]
}

function MeetingScheduleCard({
  occurrence,
  canManage,
  isPast = false,
}: {
  occurrence: MeetingOccurrenceRow
  canManage: boolean
  isPast?: boolean
}) {
  const { orgSlug } = useParams<{ orgSlug: string }>()
  const { schedule, meeting, attendees } = occurrence
  const status = getMeetingStatus(schedule.startTime, schedule.endTime)
  const recurrenceLabel =
    meeting.recurrenceType !== 'none'
      ? RECURRENCE_LABELS[meeting.recurrenceType]
      : null

  return (
    <div
      className={cn(
        'group relative flex items-stretch gap-4 rounded-lg border border-border/60 px-4 py-3 transition-colors hover:bg-muted/40',
        isPast && 'opacity-70',
        status === 'live' && 'border-l-2 border-l-red-500',
      )}
    >
      <div className="relative z-10 flex w-20 shrink-0 flex-col pt-0.5">
        <span className="text-sm font-semibold tabular-nums">
          {formatScheduleTime(schedule.startTime)}
        </span>
        <span className="text-xs tabular-nums text-muted-foreground">
          {formatScheduleTime(schedule.endTime)}
        </span>
      </div>

      <div className="relative z-10 min-w-0 flex-1 space-y-1">
        <Link
          href={`/${orgSlug}/meetings/${schedule._id}`}
          aria-label={`View ${meeting.title}`}
        >
          <h3
            className={cn(
              'truncate font-medium text-foreground/80',
              canManage && 'hover:text-foreground',
            )}
          >
            {meeting.title}
          </h3>
        </Link>

        {meeting.description ? (
          <p className="truncate text-sm text-muted-foreground">
            {meeting.description}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <MeetingStatusBadge
            startTime={schedule.startTime}
            endTime={schedule.endTime}
          />
          {recurrenceLabel ? (
            <span className="text-xs text-muted-foreground">
              {recurrenceLabel}
            </span>
          ) : null}
        </div>
      </div>

      <div className="relative z-20 flex shrink-0 items-center gap-2">
        <MeetingAttendeeAvatars attendees={attendees} />
        {meeting.meetingLink ? (
          <MeetingJoinButton url={meeting.meetingLink} />
        ) : null}
        {canManage ? (
          <div onClick={(event) => event.stopPropagation()}>
            <MeetingRowActions meeting={meeting} schedule={schedule} />
          </div>
        ) : null}
      </div>
    </div>
  )
}

function MeetingScheduleDaySection({
  label,
  occurrences,
  canManageMeeting,
  isPast = false,
}: {
  label: string
  occurrences: MeetingOccurrenceRow[]
  canManageMeeting: (meeting: MeetingOccurrenceRow['meeting']) => boolean
  isPast?: boolean
}) {
  return (
    <section className="space-y-2">
      <div className="sticky top-0 z-10 -mx-1 flex h-9 items-center bg-background/95 px-1 backdrop-blur supports-backdrop-filter:bg-background/80">
        <h2 className="text-sm font-medium text-muted-foreground">{label}</h2>
        <Badge variant={'secondary'} className="ml-1.5">
          {occurrences.length}
        </Badge>
      </div>

      <div className="space-y-2">
        {occurrences.map((occurrence) => (
          <MeetingScheduleCard
            key={occurrence.schedule._id}
            occurrence={occurrence}
            canManage={canManageMeeting(occurrence.meeting)}
            isPast={isPast}
          />
        ))}
      </div>
    </section>
  )
}

function MeetingScheduleList({
  occurrences,
  canManageMeeting,
}: {
  occurrences: MeetingOccurrenceRow[]
  canManageMeeting: (meeting: MeetingOccurrenceRow['meeting']) => boolean
}) {
  const { upcomingGroups, pastGroups } = useMemo(() => {
    const now = Date.now()
    const { upcoming, past } = partitionOccurrences(occurrences, now)
    const pastSorted = [...past].sort(
      (a, b) => b.schedule.startTime - a.schedule.startTime,
    )

    return {
      upcomingGroups: groupOccurrencesByDay(upcoming, now),
      pastGroups: groupOccurrencesByDay(pastSorted, now).reverse(),
    }
  }, [occurrences])

  return (
    <div className="space-y-6">
      {upcomingGroups.map((group) => (
        <MeetingScheduleDaySection
          key={group.dayKey}
          label={group.label}
          occurrences={group.items}
          canManageMeeting={canManageMeeting}
        />
      ))}

      {pastGroups.length > 0 ? (
        <Collapsible defaultOpen={false} className="space-y-2">
          <div className="sticky top-0 z-10 -mx-1 flex h-9 items-center bg-background/95 px-1 backdrop-blur supports-backdrop-filter:bg-background/80">
            <CollapsibleTrigger className="group flex min-w-0 flex-1 items-center gap-2 text-left">
              <RiTriangleFill className="size-1.5 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:text-foreground rotate-90 group-data-panel-open:rotate-180" />
              <span className="text-sm font-medium text-muted-foreground">
                Earlier
              </span>
              <span className="text-xs tabular-nums text-muted-foreground">
                {pastGroups.reduce(
                  (count, group) => count + group.items.length,
                  0,
                )}
              </span>
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent className="space-y-6">
            {pastGroups.map((group) => (
              <MeetingScheduleDaySection
                key={group.dayKey}
                label={group.label}
                occurrences={group.items}
                canManageMeeting={canManageMeeting}
                isPast
              />
            ))}
          </CollapsibleContent>
        </Collapsible>
      ) : null}
    </div>
  )
}
