'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { RiCalendarLine } from '@remixicon/react'
import { useMutation } from 'convex/react'
import { addDays, format, startOfDay } from 'date-fns'
import { useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import type { DateRange } from 'react-day-picker'
import z from 'zod'
import { api } from '@/convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldError } from '@/components/ui/field'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'

const raiseLeaveSchema = z.object({
  leaveType: z.enum(['sick', 'casual', 'emergency']),
  dateRange: z
    .object({
      from: z.date(),
      to: z.date(),
    })
    .refine((range) => range.to >= range.from, {
      message: 'End date must be on or after start date',
    }),
  reason: z.string().trim().min(1, 'Reason is required'),
})

type RaiseLeaveValues = z.infer<typeof raiseLeaveSchema>

function formatDateRange(range: DateRange | undefined) {
  if (!range?.from) return 'Pick dates'
  if (!range.to) return format(range.from, 'dd MMMM yyyy')
  if (range.from.getTime() === range.to.getTime()) {
    return format(range.from, 'dd MMMM yyyy')
  }
  return `${format(range.from, 'dd MMM yyyy')} – ${format(range.to, 'dd MMM yyyy')}`
}

export function RaiseLeaveDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const raiseLeave = useMutation(api.leaveRequest.raise)
  const [submitting, setSubmitting] = useState(false)
  const tomorrow = useMemo(() => startOfDay(addDays(new Date(), 1)), [])

  const form = useForm<RaiseLeaveValues>({
    resolver: zodResolver(raiseLeaveSchema),
    defaultValues: {
      leaveType: 'casual',
      reason: '',
    },
  })

  async function onSubmit(values: RaiseLeaveValues) {
    setSubmitting(true)
    try {
      await raiseLeave({
        leaveType: values.leaveType,
        startDate: startOfDay(values.dateRange.from).getTime(),
        endDate: startOfDay(values.dateRange.to).getTime(),
        reason: values.reason,
      })
      toast.success('Leave request submitted')
      form.reset({ leaveType: 'casual', reason: '' })
      onOpenChange(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to submit request',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          form.reset({ leaveType: 'casual', reason: '' })
        }
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Request leave</DialogTitle>
            <DialogDescription>
              Select a date range for your leave. Requests must be submitted at
              least one day before the start date.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Controller
              control={form.control}
              name="leaveType"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <Label htmlFor="leave-type">Leave type</Label>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="leave-type" className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sick">Sick</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldState.error ? (
                    <FieldError>{fieldState.error.message}</FieldError>
                  ) : null}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="dateRange"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <Label>Date range</Label>
                  <Popover>
                    <PopoverTrigger
                      render={
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full justify-start font-normal"
                        >
                          <RiCalendarLine className="text-muted-foreground" />
                          {formatDateRange(field.value)}
                        </Button>
                      }
                    />
                    <PopoverContent className="w-fit p-0" align="start">
                      <Calendar
                        mode="range"
                        defaultMonth={tomorrow}
                        selected={field.value}
                        disabled={{ before: tomorrow }}
                        onSelect={(range) => {
                          if (range?.from && range.to) {
                            field.onChange({ from: range.from, to: range.to })
                          }
                        }}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                  {fieldState.error ? (
                    <FieldError>{fieldState.error.message}</FieldError>
                  ) : null}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="reason"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <Label htmlFor="leave-reason">Reason</Label>
                  <Textarea
                    id="leave-reason"
                    placeholder="Brief reason for your leave"
                    rows={3}
                    {...field}
                  />
                  {fieldState.error ? (
                    <FieldError>{fieldState.error.message}</FieldError>
                  ) : null}
                </Field>
              )}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
