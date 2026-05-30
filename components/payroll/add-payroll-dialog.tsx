'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog'
import type { PayrollRecord } from '@/lib/payroll-types'

import {
  E1,
  E2,
  E3,
  type S1,
  type S2,
  type S3,
  Step1View,
  Step2View,
  Step3View,
} from './payroll-step-view'
import { PayrollStepper } from './payroll-stepper'

type Props = {
  onAdd: (r: PayrollRecord) => void
  onOpenChange: (o: boolean) => void
  open: boolean
}

export function AddPayrollDialog({ onAdd, onOpenChange, open }: Props) {
  const [step, setStep] = useState(1)
  const [s1, setS1] = useState<S1>(E1)
  const [s2, setS2] = useState<S2>(E2)
  const [s3, setS3] = useState<S3>(E3)

  const close = () => {
    setStep(1)
    setS1(E1)
    setS2(E2)
    setS3(E3)
    onOpenChange(false)
  }
  const num = (v: string) => Number(v) || 0

  const submit = () => {
    const basic = num(s2.basicSalary)
    const overtime = num(s2.overtimePay)
    const ded = num(s3.deduction)
    const perf = num(s3.bonus)
    const incentive = num(s3.incentive)
    const gross = basic + overtime + perf + incentive
    onAdd({
      id: crypto.randomUUID(),
      employeeId: crypto.randomUUID(),
      avatarUrl: null,
      employeeName: s1.employeeName,
      employeeRole: s1.employeeRole,
      creditedAt: Date.now(),
      basicSalary: basic,
      hra: 0,
      allowances: 0,
      incentives: incentive,
      pfAmount: 0,
      esiAmount: 0,
      tax: ded,
      loanRecovery: 0,
      leaveDeduction: 0,
      latePenalty: 0,
      otherDeductions: 0,
      overtimeHours: 0,
      overtimeRate: 0,
      overtimeAmount: overtime,
      performanceBonus: perf,
      festivalBonus: 0,
      manualReward: 0,
      grossSalary: gross,
      totalDeductions: ded,
      netSalary: gross - ded,
    })
    close()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) close()
      }}
    >
      <DialogContent className="max-w-md">
        <PayrollStepper current={step} />
        {step === 1 && <Step1View s1={s1} setS1={setS1} />}
        {step === 2 && <Step2View s1={s1} s2={s2} setS2={setS2} />}
        {step === 3 && <Step3View s3={s3} setS3={setS3} />}
        <DialogFooter>
          {step === 1 && (
            <>
              <Button variant="outline" onClick={close}>
                Cancel
              </Button>
              <Button
                disabled={
                  s1.employeeName.trim() === '' || s1.employeeRole.trim() === ''
                }
                onClick={() => setStep(2)}
              >
                Next →
              </Button>
            </>
          )}
          {step === 2 && (
            <>
              <Button variant="outline" onClick={() => setStep(1)}>
                ← Back
              </Button>
              <Button
                disabled={num(s2.basicSalary) === 0}
                onClick={() => setStep(3)}
              >
                Next →
              </Button>
            </>
          )}
          {step === 3 && (
            <>
              <Button variant="outline" onClick={() => setStep(2)}>
                ← Back
              </Button>
              <Button onClick={submit}>Add Payroll</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
