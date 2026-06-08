'use client'

import { Label } from '@/components/ui/label'
import {
  type EmployeeOption,
  PayrollEmployeePicker,
} from './payroll-employee-picker'
import { RoleCombobox } from './role-combobox'

export type S1 = {
  avatarUrl: string | null
  employeeId: string
  employeeName: string
  employeeRole: string
}
export type S2 = { basicSalary: string; overtimePay: string }
export type S3 = {
  addBonus: boolean
  bonus: string
  deduction: string
  incentive: string
}

export const E1: S1 = {
  avatarUrl: null,
  employeeId: '',
  employeeName: '',
  employeeRole: '',
}
export const E2: S2 = { basicSalary: '', overtimePay: '' }
export const E3: S3 = {
  addBonus: false,
  bonus: '',
  deduction: '',
  incentive: '',
}

export const NO_SPIN =
  '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'

interface Step1Props {
  employees: EmployeeOption[]
  s1: S1
  setS1: (v: S1) => void
}

export function Step1View({ employees, s1, setS1 }: Step1Props) {
  const handleSelect = (emp: EmployeeOption) => {
    setS1({
      avatarUrl: emp.image,
      employeeId: emp.id,
      employeeName: emp.name,
      employeeRole: emp.role,
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="font-semibold">Employee Details</p>
        <p className="text-sm text-muted-foreground">
          Who is this payroll for?
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Employee</Label>
        <PayrollEmployeePicker
          employees={employees}
          onChange={handleSelect}
          value={s1.employeeId}
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
