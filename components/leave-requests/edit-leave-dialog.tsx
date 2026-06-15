'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from 'convex/react'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod'
import { api } from '@/convex/_generated/api'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
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
import { Textarea } from '@/components/ui/textarea'
import type { LeaveRequestRow } from './columns'
import { formatLeaveDate, leaveTypeLabels } from './leave-formatters'
import { LeaveStatusBadge } from './leave-status-badge'

const rejectFlipSchema = z.object({
  rejectionReason: z.string().trim().min(1, 'Rejection reason is required'),
})

type RejectFlipValues = z.infer<typeof rejectFlipSchema>

function LeaveRequestContext({ request }: { request: LeaveRequestRow }) {
  const employee = request.employee

  return (
    <div className="space-y-3 rounded-lg border bg-muted/40 p-4 text-sm">
      {employee ? (
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={employee.image ?? ''} alt={employee.name} />
            <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-medium">{employee.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {employee.email}
            </p>
          </div>
        </div>
      ) : null}

      <dl className="grid gap-2">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Type</dt>
          <dd className="font-medium">{leaveTypeLabels[request.leaveType]}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Dates</dt>
          <dd className="text-right font-medium">
            {formatLeaveDate(request.startDate, request.endDate)}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="shrink-0 text-muted-foreground">Reason</dt>
          <dd className="text-right">{request.reason}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted-foreground">Current status</dt>
          <dd>
            <LeaveStatusBadge status={request.status} />
          </dd>
        </div>
        {request.status === 'rejected' && request.rejectionReason ? (
          <div className="flex justify-between gap-4">
            <dt className="shrink-0 text-muted-foreground">Rejection reason</dt>
            <dd className="text-right text-destructive">
              {request.rejectionReason}
            </dd>
          </div>
        ) : null}
      </dl>
    </div>
  )
}

export function EditLeaveDialog({
  request,
  open,
  onOpenChange,
}: {
  request: LeaveRequestRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const updateLeave = useMutation(api.leaveRequest.update)
  const [submitting, setSubmitting] = useState(false)

  const isApprovedFlip = request?.status === 'approved'
  const isRejectedFlip = request?.status === 'rejected'
  const canFlip = isApprovedFlip || isRejectedFlip

  const form = useForm<RejectFlipValues>({
    resolver: zodResolver(rejectFlipSchema),
    defaultValues: { rejectionReason: '' },
  })

  useEffect(() => {
    if (!request) return
    form.reset({ rejectionReason: '' })
  }, [form, request])

  async function handleApproveFlip() {
    if (!request || request.status !== 'rejected') return

    setSubmitting(true)
    try {
      await updateLeave({
        leaveRequestId: request._id,
        body: { status: 'approved' },
      })
      toast.success('Leave request marked as approved')
      onOpenChange(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update status',
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRejectFlip(values: RejectFlipValues) {
    if (!request || request.status !== 'approved') return

    setSubmitting(true)
    try {
      await updateLeave({
        leaveRequestId: request._id,
        body: {
          status: 'rejected',
          rejectionReason: values.rejectionReason,
        },
      })
      toast.success('Leave request marked as rejected')
      onOpenChange(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update status',
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (!canFlip) {
    return null
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          form.reset({ rejectionReason: '' })
        }
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent className="sm:max-w-md">
        {isApprovedFlip ? (
          <form onSubmit={form.handleSubmit(handleRejectFlip)}>
            <DialogHeader>
              <DialogTitle>Mark as rejected</DialogTitle>
              <DialogDescription>
                Change this approved leave request to rejected. The employee
                reason and dates will stay unchanged.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {request ? <LeaveRequestContext request={request} /> : null}
              <Controller
                control={form.control}
                name="rejectionReason"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <Label htmlFor="edit-rejection-reason">
                      Rejection reason
                    </Label>
                    <Textarea
                      id="edit-rejection-reason"
                      placeholder="Explain why this request is being rejected"
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
              <Button type="submit" variant="destructive" disabled={submitting}>
                {submitting ? 'Saving...' : 'Mark as rejected'}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Mark as approved</DialogTitle>
              <DialogDescription>
                Change this rejected leave request to approved. The employee
                reason and dates will stay unchanged.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {request ? <LeaveRequestContext request={request} /> : null}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={submitting}
                onClick={() => void handleApproveFlip()}
              >
                {submitting ? 'Saving...' : 'Mark as approved'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
