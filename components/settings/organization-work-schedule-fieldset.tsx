'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { FieldDescription, FieldLegend, FieldSet } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { api } from '@/convex/_generated/api'
import { cn } from '@/lib/utils'
import { Spinner } from '../ui/spinner'

export type WorkSchedule =
  (typeof api.organizationSettings.getSettings._returnType)['workingSchedule']

type Weekday = keyof WorkSchedule

const WEEKDAYS: Weekday[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
]

const WEEKDAY_LABELS: Record<Weekday, string> = {
  sunday: 'Sunday',
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
}

const DEFAULT_WORK_SCHEDULE: WorkSchedule = {
  sunday: { enabled: false, startTime: '09:00', endTime: '17:00' },
  monday: { enabled: true, startTime: '09:00', endTime: '17:00' },
  tuesday: { enabled: true, startTime: '09:00', endTime: '17:00' },
  wednesday: { enabled: true, startTime: '09:00', endTime: '17:00' },
  thursday: { enabled: true, startTime: '09:00', endTime: '17:00' },
  friday: { enabled: true, startTime: '09:00', endTime: '17:00' },
  saturday: { enabled: false, startTime: '09:00', endTime: '17:00' },
}

type OrganizationWorkScheduleFieldsetProps = {
  value?: WorkSchedule
  isLoading?: boolean
  isSaving?: boolean
  onSave: (schedule: WorkSchedule) => Promise<void>
}

export function OrganizationWorkScheduleFieldset({
  value,
  isLoading = false,
  isSaving = false,
  onSave,
}: OrganizationWorkScheduleFieldsetProps) {
  const [schedule, setSchedule] = useState<WorkSchedule>(DEFAULT_WORK_SCHEDULE)

  useEffect(() => {
    if (value) {
      setSchedule(value)
    }
  }, [value])

  function updateDay(weekday: Weekday, patch: Partial<WorkSchedule[Weekday]>) {
    setSchedule((current) => ({
      ...current,
      [weekday]: { ...current[weekday], ...patch },
    }))
  }

  return (
    <FieldSet className="gap-4">
      <div>
        <FieldLegend>Working days and hours</FieldLegend>
        <FieldDescription>
          Set which days count as working days for your organization and the
          expected hours for each day.
        </FieldDescription>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {WEEKDAYS.map((weekday) => (
            <Skeleton key={weekday} className="h-10 w-full" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {WEEKDAYS.map((weekday) => {
            const day = schedule[weekday]

            return (
              <div
                key={weekday}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-border px-3 py-2.5"
              >
                <Switch
                  id={`workday-${weekday}`}
                  checked={day.enabled}
                  disabled={isSaving}
                  onCheckedChange={(checked) =>
                    updateDay(weekday, { enabled: checked })
                  }
                />
                <Label
                  htmlFor={`workday-${weekday}`}
                  className={cn(
                    'min-w-24 text-sm font-medium',
                    !day.enabled && 'text-muted-foreground',
                  )}
                >
                  {WEEKDAY_LABELS[weekday]}
                </Label>

                {day.enabled ? (
                  <div className="ml-auto flex items-center gap-2">
                    <Input
                      type="time"
                      value={day.startTime}
                      disabled={isSaving}
                      className="w-30"
                      onChange={(event) =>
                        updateDay(weekday, { startTime: event.target.value })
                      }
                    />
                    <span className="text-sm text-muted-foreground">-</span>
                    <Input
                      type="time"
                      value={day.endTime}
                      disabled={isSaving}
                      className="w-30"
                      onChange={(event) =>
                        updateDay(weekday, { endTime: event.target.value })
                      }
                    />
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      )}

      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isLoading || isSaving}
          onClick={() => void onSave(schedule)}
        >
          {isSaving ? (
            <>
              <Spinner className="size-3.5" data-icon="inline-start" />
              Saving...
            </>
          ) : (
            'Save schedule'
          )}
        </Button>
      </div>
    </FieldSet>
  )
}
