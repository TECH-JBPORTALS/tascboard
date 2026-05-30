'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import type { BonusFormState } from './add-payroll-form'

type Props = {
  values: BonusFormState
  onChange: (
    key: keyof BonusFormState,
  ) => (e: React.ChangeEvent<HTMLInputElement>) => void
}

const FIELDS: [string, keyof BonusFormState][] = [
  ['Performance Bonus', 'performanceBonus'],
  ['Festival Bonus', 'festivalBonus'],
  ['Incentives', 'incentives'],
  ['Manual Reward', 'manualReward'],
]

export function BonusForm({ values, onChange }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <Separator />
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Bonus &amp; Incentives
      </p>
      <div className="grid grid-cols-2 gap-3">
        {FIELDS.map(([label, key]) => (
          <div key={key} className="flex flex-col gap-1.5">
            <Label>{label}</Label>
            <Input
              type="number"
              placeholder="0"
              value={values[key]}
              onChange={onChange(key)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
