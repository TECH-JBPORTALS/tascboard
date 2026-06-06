'use client'

import { useMutation } from 'convex/react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/convex/_generated/api'
import type { LeaveType } from '@/lib/attendance-types'

type Props = {
  employeeId: string
  open: boolean
  onOpenChange: (v: boolean) => void
}

const LEAVE_TYPES: LeaveType[] = ['sick', 'casual', 'emergency']

export function EmployeeRaiseLeaveDialog({ employeeId, open, onOpenChange }: Props) {
  const raise = useMutation(api.leaveRequest.raise)
  const [leaveType, setLeaveType] = useState<LeaveType>('casual')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')

  const reset = () => {
    setLeaveType('casual')
    setStartDate('')
    setEndDate('')
    setReason('')
  }

  const handleSubmit = async () => {
    if (!startDate || !endDate || !reason || !employeeId) return
    await raise({
      employeeId,
      leaveType,
      startDate: new Date(startDate).getTime(),
      endDate: new Date(endDate).getTime(),
      reason,
    })
    reset()
    onOpenChange(false)
  }

  const isValid = !!startDate && !!endDate && !!reason && !!employeeId

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v) }}>
      <DialogContent className='max-w-sm'>
        <DialogHeader>
          <DialogTitle>Raise Leave Request</DialogTitle>
        </DialogHeader>
        <div className='flex flex-col gap-3 py-2'>
          <div className='flex flex-col gap-1.5'>
            <Label>Leave Type</Label>
            <Select value={leaveType} onValueChange={(v) => setLeaveType((v ?? 'casual') as LeaveType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LEAVE_TYPES.map((t) => (
                  <SelectItem key={t} value={t} className='capitalize'>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='grid grid-cols-2 gap-2'>
            <div className='flex flex-col gap-1.5'>
              <Label>From</Label>
              <Input type='date' value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className='flex flex-col gap-1.5'>
              <Label>To</Label>
              <Input type='date' value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <div className='flex flex-col gap-1.5'>
            <Label>Reason</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder='Reason for leave…'
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => { reset(); onOpenChange(false) }}>Cancel</Button>
          <Button disabled={!isValid} onClick={() => void handleSubmit()}>Submit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}