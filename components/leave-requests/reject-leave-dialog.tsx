'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from 'convex/react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
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

const rejectLeaveSchema = z.object({
  rejectionReason: z.string().trim().min(1, 'Rejection reason is required'),
})

type RejectLeaveValues = z.infer<typeof rejectLeaveSchema>

export function RejectLeaveDialog({
  leaveRequestId,
  open,
  onOpenChange,
}: {
  leaveRequestId: Id<'leaveRequests'> | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const rejectLeave = useMutation(api.leaveRequest.rejectLeaveRequest)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<RejectLeaveValues>({
    resolver: zodResolver(rejectLeaveSchema),
    defaultValues: { rejectionReason: '' },
  })

  async function onSubmit(values: RejectLeaveValues) {
    if (!leaveRequestId) return

    setSubmitting(true)
    try {
      await rejectLeave({
        leaveRequestId,
        rejectionReason: values.rejectionReason,
      })
      toast.success('Leave request rejected')
      form.reset({ rejectionReason: '' })
      onOpenChange(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to reject request',
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
          form.reset({ rejectionReason: '' })
        }
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Reject leave request</DialogTitle>
            <DialogDescription>
              Provide a reason so the employee understands why this request was
              rejected.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Controller
              control={form.control}
              name="rejectionReason"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <Label htmlFor="rejection-reason">Rejection reason</Label>
                  <Textarea
                    id="rejection-reason"
                    placeholder="Explain why this request is being rejected"
                    rows={4}
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
              {submitting ? 'Rejecting...' : 'Reject request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
