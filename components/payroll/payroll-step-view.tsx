'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { RoleCombobox } from './role-combobox'

export type S1 = { employeeName: string; employeeRole: string }
export type S2 = { basicSalary: string; overtimePay: string }
export type S3 = {
  deduction: string
  addBonus: boolean
  bonus: string
  incentive: string
}

export const E1: S1 = { employeeName: '', employeeRole: '' }
export const E2: S2 = { basicSalary: '', overtimePay: '' }
export const E3: S3 = {
  deduction: '',
  addBonus: false,
  bonus: '',
  incentive: '',
}

export const NO_SPIN =
  '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'

type NumInput = { label: string; value: string; onChange: (v: string) => void }
function NumField({ label, value, onChange }: NumInput) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <Input
        type="number"
        placeholder="0"
        className={NO_SPIN}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

export function Step1View({ s1, setS1 }: { s1: S1; setS1: (v: S1) => void }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="font-semibold">Employee Details</p>
        <p className="text-sm text-muted-foreground">
          Who is this payroll for?
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Employee Name</Label>
        <Input
          placeholder="Sarah Jenkins"
          value={s1.employeeName}
          onChange={(e) => setS1({ ...s1, employeeName: e.target.value })}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Role</Label>
        <RoleCombobox
          value={s1.employeeRole}
          onChange={(v) => setS1({ ...s1, employeeRole: v })}
        />
      </div>
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
        <Label htmlFor="bonus-toggle" className="cursor-pointer">
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
