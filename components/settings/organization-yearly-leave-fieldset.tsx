'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { FieldDescription, FieldLegend, FieldSet } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/convex/_generated/api'
import { Spinner } from '../ui/spinner'

export type LeaveQuota =
  (typeof api.organizationSettings.getSettings._returnType)['leaveQuotas'][number]

type OrganizationYearlyLeaveFieldsetProps = {
  value?: LeaveQuota[]
  isLoading?: boolean
  isSaving?: boolean
  onSave: (leaveQuota: LeaveQuota) => Promise<void>
}

export function OrganizationYearlyLeaveFieldset({
  value = [],
  isLoading = false,
  isSaving = false,
  onSave,
}: OrganizationYearlyLeaveFieldsetProps) {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const [paidLeaves, setPaidLeaves] = useState('15')

  const quotaMap = useMemo(
    () => new Map(value.map((entry) => [entry.year, entry.paidLeaves])),
    [value],
  )

  useEffect(() => {
    const existing = quotaMap.get(year)
    setPaidLeaves(String(existing ?? 15))
  }, [quotaMap, year])

  const configuredYears = useMemo(() => {
    const years = new Set(value.map((entry) => entry.year))
    years.add(currentYear)
    return Array.from(years).sort((a, b) => a - b)
  }, [currentYear, value])

  async function handleSave() {
    const parsed = Number.parseInt(paidLeaves, 10)
    if (Number.isNaN(parsed) || parsed < 0 || parsed > 365) {
      return
    }
    await onSave({ year, paidLeaves: parsed })
  }

  if (isLoading) {
    return (
      <FieldSet className="gap-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-20 w-full" />
      </FieldSet>
    )
  }

  return (
    <FieldSet className="gap-4">
      <div>
        <FieldLegend>Yearly paid leaves</FieldLegend>
        <FieldDescription>
          Set how many paid leave days employees can use each calendar year.
          Defaults to 15 when not configured.
        </FieldDescription>
      </div>

      {configuredYears.length > 0 ? (
        <div className="rounded-lg border">
          <div className="grid grid-cols-2 gap-2 border-b px-3 py-2 text-xs font-medium text-muted-foreground">
            <span>Year</span>
            <span>Paid leaves</span>
          </div>
          {configuredYears.map((entryYear) => (
            <div
              key={entryYear}
              className="grid grid-cols-2 gap-2 px-3 py-2 text-sm"
            >
              <span>{entryYear}</span>
              <span>{quotaMap.get(entryYear) ?? 15} days</span>
            </div>
          ))}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-[140px_1fr_auto] sm:items-end">
        <div className="grid gap-2">
          <Label htmlFor="leave-quota-year">Year</Label>
          <Input
            id="leave-quota-year"
            type="number"
            min={currentYear}
            max={currentYear + 10}
            value={year}
            onChange={(event) => setYear(Number(event.target.value))}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="leave-quota-days">Paid leaves</Label>
          <Input
            id="leave-quota-days"
            type="number"
            min={0}
            max={365}
            value={paidLeaves}
            onChange={(event) => setPaidLeaves(event.target.value)}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={isSaving || year < currentYear}
          onClick={() => void handleSave()}
        >
          {isSaving ? <Spinner className="size-4" /> : 'Save quota'}
        </Button>
      </div>
    </FieldSet>
  )
}
