'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from 'convex/react'
import { startOfMonth } from 'date-fns'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/convex/_generated/api'
import { startOfCalendarDay } from '@/lib/calendar-date'
import { calculateNetSalary, formatCurrency } from '@/lib/payroll-types'

const editSchema = z.object({
  basicSalary: z.number().min(0),
  deduction: z.number().min(0),
  overtimePay: z.number().min(0),
  bonus: z.number().min(0),
  notes: z.string().optional(),
})

type EditValues = z.infer<typeof editSchema>

type EditPayrollDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  employeeId: string
  employeeName: string
  month: Date
  initialValues: {
    basicSalary: number
    deduction: number
    overtimePay: number
    bonus: number
    notes?: string
  }
}

export function EditPayrollDialog({
  open,
  onOpenChange,
  employeeId,
  employeeName,
  month,
  initialValues,
}: EditPayrollDialogProps) {
  const upsert = useMutation(api.payroll.upsert)
  const form = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: initialValues,
  })

  useEffect(() => {
    if (open) {
      form.reset(initialValues)
    }
  }, [open, initialValues, form])

  const watched = form.watch([
    'basicSalary',
    'deduction',
    'overtimePay',
    'bonus',
  ])
  const netSalary = calculateNetSalary({
    basicSalary: watched[0] ?? 0,
    deduction: watched[1] ?? 0,
    overtimePay: watched[2] ?? 0,
    bonus: watched[3] ?? 0,
  })

  async function onSubmit(values: EditValues) {
    try {
      await upsert({
        employeeId,
        month: startOfCalendarDay(startOfMonth(month)),
        basicSalary: values.basicSalary,
        deduction: values.deduction,
        overtimePay: values.overtimePay,
        bonus: values.bonus,
        notes: values.notes?.trim() || undefined,
      })
      toast.success('Payslip saved')
      onOpenChange(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to save payslip',
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit payslip</DialogTitle>
          <DialogDescription>
            Adjust payroll for {employeeName}.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <Controller
            control={form.control}
            name="basicSalary"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <Label htmlFor="basicSalary">Basic salary</Label>
                <Input
                  id="basicSalary"
                  type="number"
                  min={0}
                  {...field}
                  onChange={(event) =>
                    field.onChange(event.target.valueAsNumber)
                  }
                />
                {fieldState.error ? (
                  <FieldError errors={[fieldState.error]} />
                ) : null}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="deduction"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <Label htmlFor="deduction">Deduction</Label>
                <Input
                  id="deduction"
                  type="number"
                  min={0}
                  {...field}
                  onChange={(event) =>
                    field.onChange(event.target.valueAsNumber)
                  }
                />
                {fieldState.error ? (
                  <FieldError errors={[fieldState.error]} />
                ) : null}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="overtimePay"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <Label htmlFor="overtimePay">Overtime pay</Label>
                <Input
                  id="overtimePay"
                  type="number"
                  min={0}
                  {...field}
                  onChange={(event) =>
                    field.onChange(event.target.valueAsNumber)
                  }
                />
                {fieldState.error ? (
                  <FieldError errors={[fieldState.error]} />
                ) : null}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="bonus"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <Label htmlFor="bonus">Bonus</Label>
                <Input
                  id="bonus"
                  type="number"
                  min={0}
                  {...field}
                  onChange={(event) =>
                    field.onChange(event.target.valueAsNumber)
                  }
                />
                {fieldState.error ? (
                  <FieldError errors={[fieldState.error]} />
                ) : null}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="notes"
            render={({ field }) => (
              <Field>
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" rows={3} {...field} />
              </Field>
            )}
          />
          <div className="rounded-md border px-3 py-2 text-sm">
            <span className="text-muted-foreground">Net salary: </span>
            <span className="font-semibold">{formatCurrency(netSalary)}</span>
          </div>
          <DialogFooter>
            <Button type="submit">Save payslip</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
