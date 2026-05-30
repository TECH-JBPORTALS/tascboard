'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

export type AddPayrollFormState = {
  employeeName: string
  employeeRole: string
  basicSalary: string
  hra: string
  allowances: string
  overtimeHours: string
  overtimeRate: string
  pfAmount: string
  esiAmount: string
  tax: string
  loanRecovery: string
  leaveDeduction: string
  latePenalty: string
  otherDeductions: string
}

export type BonusFormState = {
  performanceBonus: string
  festivalBonus: string
  incentives: string
  manualReward: string
}

type Props = {
  onChange: (
    key: keyof AddPayrollFormState,
  ) => (e: React.ChangeEvent<HTMLInputElement>) => void
  values: AddPayrollFormState
}

function Field({
  label,
  field,
  values,
  onChange,
  type = 'number',
}: {
  label: string
  field: keyof AddPayrollFormState
  values: AddPayrollFormState
  onChange: Props['onChange']
  type?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <Input
        type={type}
        placeholder="0"
        value={values[field]}
        onChange={onChange(field)}
      />
    </div>
  )
}

export function AddPayrollForm({ onChange, values }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Employee Name"
          field="employeeName"
          values={values}
          onChange={onChange}
          type="text"
        />
        <Field
          label="Role"
          field="employeeRole"
          values={values}
          onChange={onChange}
          type="text"
        />
      </div>
      <Separator />
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Earnings
      </p>
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Basic Salary"
          field="basicSalary"
          values={values}
          onChange={onChange}
        />
        <Field label="HRA" field="hra" values={values} onChange={onChange} />
        <Field
          label="Allowances"
          field="allowances"
          values={values}
          onChange={onChange}
        />
        <Field
          label="Overtime Hours"
          field="overtimeHours"
          values={values}
          onChange={onChange}
        />
        <Field
          label="Overtime Rate / hr"
          field="overtimeRate"
          values={values}
          onChange={onChange}
        />
      </div>
      <Separator />
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Deductions
      </p>
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="PF Amount"
          field="pfAmount"
          values={values}
          onChange={onChange}
        />
        <Field
          label="ESI Amount"
          field="esiAmount"
          values={values}
          onChange={onChange}
        />
        <Field label="Tax" field="tax" values={values} onChange={onChange} />
        <Field
          label="Loan Recovery"
          field="loanRecovery"
          values={values}
          onChange={onChange}
        />
        <Field
          label="Leave Deduction"
          field="leaveDeduction"
          values={values}
          onChange={onChange}
        />
        <Field
          label="Late Penalty"
          field="latePenalty"
          values={values}
          onChange={onChange}
        />
        <Field
          label="Other Deductions"
          field="otherDeductions"
          values={values}
          onChange={onChange}
        />
      </div>
    </div>
  )
}
