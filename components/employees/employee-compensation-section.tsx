'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from 'convex/react'
import { useQuery } from 'convex-helpers/react/cache'
import { format, startOfMonth } from 'date-fns'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Field, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/convex/_generated/api'
import { startOfCalendarDay } from '@/lib/calendar-date'
import { formatCurrency } from '@/lib/payroll-types'

const compensationSchema = z.object({
  monthlyBasicSalary: z.number().min(0, 'Salary must be zero or greater'),
})

type CompensationValues = z.infer<typeof compensationSchema>

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  )
}

export function EmployeeCompensationSection({
  employeeId,
}: {
  employeeId: string
}) {
  const activeCompensation = useQuery(api.compensation.getActive, {
    employeeId,
  })
  const history = useQuery(api.compensation.listHistory, { employeeId })
  const setCompensation = useMutation(api.compensation.set)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const form = useForm<CompensationValues>({
    resolver: zodResolver(compensationSchema),
    defaultValues: {
      monthlyBasicSalary: 0,
    },
  })

  useEffect(() => {
    form.reset({
      monthlyBasicSalary: activeCompensation?.monthlyBasicSalary ?? 0,
    })
  }, [activeCompensation, form])

  async function onSubmit(values: CompensationValues) {
    setSaving(true)
    try {
      await setCompensation({
        employeeId,
        monthlyBasicSalary: values.monthlyBasicSalary,
        effectiveFrom: startOfCalendarDay(startOfMonth(new Date())),
      })
      toast.success('Compensation updated')
      setOpen(false)
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to update compensation',
      )
    } finally {
      setSaving(false)
    }
  }

  if (activeCompensation === undefined || history === undefined) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-1">
          <CardTitle className="text-sm">Current Compensation</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button size="sm" variant="outline" />}>
              {activeCompensation ? 'Update salary' : 'Set salary'}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {activeCompensation ? 'Update salary' : 'Set salary'}
                </DialogTitle>
                <DialogDescription>
                  Monthly basic salary used when generating payroll for this
                  employee.
                </DialogDescription>
              </DialogHeader>
              <form
                className="space-y-4"
                onSubmit={form.handleSubmit(onSubmit)}
              >
                <Controller
                  control={form.control}
                  name="monthlyBasicSalary"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <Label htmlFor="monthlyBasicSalary">
                        Monthly basic salary (INR)
                      </Label>
                      <Input
                        id="monthlyBasicSalary"
                        type="number"
                        min={0}
                        step={1}
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
                <DialogFooter>
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-3">
          <FieldRow
            label="Monthly basic salary"
            value={
              activeCompensation
                ? formatCurrency(activeCompensation.monthlyBasicSalary)
                : 'Not set'
            }
          />
          <FieldRow
            label="Effective from"
            value={
              activeCompensation
                ? format(new Date(activeCompensation.effectiveFrom), 'MMM yyyy')
                : 'Not set'
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-1">
          <CardTitle className="text-sm">Salary History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No compensation history yet.
            </p>
          ) : (
            history.map((entry, index) => (
              <div
                key={`${entry.effectiveFrom}-${index}`}
                className="flex items-start justify-between gap-3 text-sm"
              >
                <span className="text-muted-foreground">
                  {format(new Date(entry.effectiveFrom), 'MMM yyyy')}
                  {entry.effectiveTo
                    ? ` – ${format(new Date(entry.effectiveTo), 'MMM yyyy')}`
                    : ' – present'}
                </span>
                <span>{formatCurrency(entry.monthlyBasicSalary)}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
