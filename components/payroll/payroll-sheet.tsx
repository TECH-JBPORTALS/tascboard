'use client'

import { useMutation } from 'convex/react'
import { format } from 'date-fns'
import * as React from 'react'
import { toast } from 'sonner'
import { UserAvatar } from '@/components/employees/user-avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { formatCurrency, type PayrollRecord } from '@/lib/payroll-types'
import { PayrollSheetSummary } from './payroll-sheet-summary'

type Props = {
  onOpenChange: (open: boolean) => void
  open: boolean
  record: PayrollRecord | null
}

type EditState = {
  basicSalary: string
  overtimePay: string
  bonus: string
  deduction: string
}

function toEditState(r: PayrollRecord): EditState {
  return {
    basicSalary: String(r.basicSalary),
    overtimePay: String(r.overtimeAmount),
    bonus: String(r.performanceBonus),
    deduction: String(r.totalDeductions),
  }
}

function calcNet(e: EditState): number {
  const basic = Number(e.basicSalary) || 0
  const overtime = Number(e.overtimePay) || 0
  const bonus = Number(e.bonus) || 0
  const deduction = Number(e.deduction) || 0
  return basic + overtime + bonus - deduction
}

export function PayrollSheet({ onOpenChange, open, record }: Props) {
  const updateMutation = useMutation(api.payroll.update)
  const [edit, setEdit] = React.useState<EditState | null>(null)
  const [saving, setSaving] = React.useState(false)

  // sync edit state when record changes
  React.useEffect(() => {
    if (record) setEdit(toEditState(record))
    else setEdit(null)
  }, [record?.id, record])

  if (!record || !edit) return null

  const isDirty =
    edit.basicSalary !== String(record.basicSalary) ||
    edit.overtimePay !== String(record.overtimeAmount) ||
    edit.bonus !== String(record.performanceBonus) ||
    edit.deduction !== String(record.totalDeductions)

  const net = calcNet(edit)

  const set = (key: keyof EditState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setEdit((prev) => prev ? { ...prev, [key]: e.target.value } : prev)

  const handleSave = async () => {
    if (!isDirty) return
    setSaving(true)
    try {
      await updateMutation({
        id: record.id as Id<'payroll'>,
        basicSalary: Number(edit.basicSalary) || 0,
        overtimePay: Number(edit.overtimePay) || 0,
        bonus: Number(edit.bonus) || 0,
        deduction: Number(edit.deduction) || 0,
        netSalary: net,
      })
      toast.success('Payroll updated')
    } catch {
      toast.error('Failed to update payroll')
    } finally {
      setSaving(false)
    }
  }

  const handleDiscard = () => setEdit(toEditState(record))

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side='right' className='w-full sm:max-w-md p-0 flex flex-col'>

        {/* Header */}
        <SheetHeader className='px-6 py-4 pr-12 border-b border-border shrink-0'>
          <div className='flex items-center gap-3'>
            <UserAvatar
              name={record.employeeName}
              imageUrl={record.avatarUrl}
            />
            <div>
              <SheetTitle>{record.employeeName}</SheetTitle>
              <SheetDescription>
                {record.employeeRole} · {format(new Date(record.creditedAt), 'MMMM yyyy')}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className='flex-1'>
          <div className='flex flex-col gap-6 px-6 py-5'>

            {/* Editable fields */}
            <div className='flex flex-col gap-3'>
              <p className='text-xs font-medium uppercase tracking-wider text-muted-foreground'>
                Edit Payroll
              </p>
              <Separator />
              <div className='grid grid-cols-2 gap-3'>
                <div className='flex flex-col gap-1.5'>
                  <Label className='text-xs'>Basic Salary</Label>
                  <Input
                    type='number'
                    min={0}
                    value={edit.basicSalary}
                    onChange={set('basicSalary')}
                    className='h-8 text-sm'
                  />
                </div>
                <div className='flex flex-col gap-1.5'>
                  <Label className='text-xs'>Overtime Pay</Label>
                  <Input
                    type='number'
                    min={0}
                    value={edit.overtimePay}
                    onChange={set('overtimePay')}
                    className='h-8 text-sm'
                  />
                </div>
                <div className='flex flex-col gap-1.5'>
                  <Label className='text-xs'>Bonus</Label>
                  <Input
                    type='number'
                    min={0}
                    value={edit.bonus}
                    onChange={set('bonus')}
                    className='h-8 text-sm'
                  />
                </div>
                <div className='flex flex-col gap-1.5'>
                  <Label className='text-xs'>Total Deductions</Label>
                  <Input
                    type='number'
                    min={0}
                    value={edit.deduction}
                    onChange={set('deduction')}
                    className='h-8 text-sm'
                  />
                </div>
              </div>

              {/* Live net preview */}
              <div className='flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2'>
                <span className='text-xs text-muted-foreground'>Net Salary (preview)</span>
                <span className={`text-sm font-semibold ${net < 0 ? 'text-destructive' : ''}`}>
                  {formatCurrency(net)}
                </span>
              </div>

              {/* Save / Discard */}
              {isDirty && (
                <div className='flex items-center gap-2'>
                  <Button size='sm' onClick={handleSave} disabled={saving} className='flex-1'>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button size='sm' variant='outline' onClick={handleDiscard} disabled={saving}>
                    Discard
                  </Button>
                </div>
              )}
            </div>

            {/* Read-only breakdown */}
            <div className='flex flex-col gap-3'>
              <p className='text-xs font-medium uppercase tracking-wider text-muted-foreground'>
                Breakdown
              </p>
              <Separator />
              <div className='flex flex-col gap-2'>
                {[
                  { label: 'Basic Salary', value: record.basicSalary },
                  { label: 'HRA', value: record.hra },
                  { label: 'Allowances', value: record.allowances },
                  { label: 'Overtime Pay', value: record.overtimeAmount },
                  record.incentives > 0 && { label: 'Incentives', value: record.incentives },
                  record.performanceBonus > 0 && { label: 'Performance Bonus', value: record.performanceBonus },
                  record.festivalBonus > 0 && { label: 'Festival Bonus', value: record.festivalBonus },
                  record.manualReward > 0 && { label: 'Manual Reward', value: record.manualReward },
                ]
                  .filter(Boolean)
                  .map((row) => {
                    if (!row) return null
                    const { label, value } = row as { label: string; value: number }
                    return (
                      <div key={label} className='flex items-center justify-between'>
                        <span className='text-sm text-muted-foreground'>{label}</span>
                        <span className='text-sm font-medium'>{formatCurrency(value)}</span>
                      </div>
                    )
                  })}
              </div>
            </div>

            <div className='flex flex-col gap-3'>
              <p className='text-xs font-medium uppercase tracking-wider text-muted-foreground'>
                Deductions
              </p>
              <Separator />
              <div className='flex flex-col gap-2'>
                {[
                  { label: 'PF', value: record.pfAmount },
                  { label: 'ESI', value: record.esiAmount },
                  { label: 'Tax', value: record.tax },
                  record.loanRecovery > 0 && { label: 'Loan Recovery', value: record.loanRecovery },
                  record.leaveDeduction > 0 && { label: 'Leave Deduction', value: record.leaveDeduction },
                  record.latePenalty > 0 && { label: 'Late Penalty', value: record.latePenalty },
                  record.otherDeductions > 0 && { label: 'Other', value: record.otherDeductions },
                ]
                  .filter(Boolean)
                  .map((row) => {
                    if (!row) return null
                    const { label, value } = row as { label: string; value: number }
                    return (
                      <div key={label} className='flex items-center justify-between'>
                        <span className='text-sm text-muted-foreground'>{label}</span>
                        <span className='text-sm font-medium text-destructive'>
                          − {formatCurrency(value)}
                        </span>
                      </div>
                    )
                  })}
              </div>
            </div>

            <PayrollSheetSummary
              creditedAt={record.creditedAt}
              grossSalary={record.grossSalary}
              netSalary={record.netSalary}
              totalDeductions={record.totalDeductions}
            />

          </div>
        </ScrollArea>

      </SheetContent>
    </Sheet>
  )
}