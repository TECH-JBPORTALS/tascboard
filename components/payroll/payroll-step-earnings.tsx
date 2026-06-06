'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { NO_SPIN, type S1, type S2, type S3 } from './payroll-step-view'

type NumInput = { label: string; onChange: (v: string) => void; value: string }

export function NumField({ label, onChange, value }: NumInput) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <Input
        className={NO_SPIN}
        placeholder="0"
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

export function Step2View({
  s1,
  s2,
  setS2,
}: {
  s1: S1
  s2: S2
  setS2: (v: S2) => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="font-semibold">Earnings</p>
        <p className="text-sm text-muted-foreground">
          {s1.employeeName} · {s1.employeeRole}
        </p>
      </div>
      <NumField
        label="Basic Salary"
        value={s2.basicSalary}
        onChange={(v) => setS2({ ...s2, basicSalary: v })}
      />
      <NumField
        label="Overtime Pay"
        value={s2.overtimePay}
        onChange={(v) => setS2({ ...s2, overtimePay: v })}
      />
    </div>
  )
}

export function Step3View({ s3, setS3 }: { s3: S3; setS3: (v: S3) => void }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="font-semibold">Deductions</p>
        <p className="text-sm text-muted-foreground">
          Add deductions and optional bonus.
        </p>
      </div>
      <NumField
        label="Total Deduction"
        value={s3.deduction}
        onChange={(v) => setS3({ ...s3, deduction: v })}
      />
      <Separator />
      <div className="flex items-center gap-2">
        <Checkbox
          id="bonus-toggle"
          checked={s3.addBonus}
          onCheckedChange={(v) => setS3({ ...s3, addBonus: !!v })}
        />
        <Label className="cursor-pointer" htmlFor="bonus-toggle">
          Add Bonus / Incentive
        </Label>
      </div>
      {s3.addBonus && (
        <>
          <NumField
            label="Bonus"
            value={s3.bonus}
            onChange={(v) => setS3({ ...s3, bonus: v })}
          />
          <NumField
            label="Incentive"
            value={s3.incentive}
            onChange={(v) => setS3({ ...s3, incentive: v })}
          />
        </>
      )}
    </div>
  )
}
