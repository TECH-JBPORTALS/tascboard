'use client'

import { useMutation } from 'convex/react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/convex/_generated/api'
import type { EmployeeRef, LeaveType } from '@/lib/attendance-types'

type Props = {
  employees: EmployeeRef[]
  open: boolean
  onOpenChange: (v: boolean) => void
}

const LEAVE_TYPES: LeaveType[] = ['sick', 'casual', 'emergency']

export function RaiseLeaveDialog({ employees, open, onOpenChange }: Props) {
  const raise = useMutation(api.leaveRequest.raise)
  const [employeeId, setEmployeeId] = useState('')
  const [leaveType, setLeaveType] = useState<LeaveType>('casual')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')

  const reset = () => {
    setEmployeeId('')
    setLeaveType('casual')
    setStartDate('')
    setEndDate('')
    setReason('')
  }

  const handleSubmit = async () => {
    if (!employeeId || !startDate || !endDate || !reason) return
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Raise Leave Request</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Employee</Label>
            <Select
              value={employeeId}
              onValueChange={(v) => setEmployeeId(v ?? '')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Leave Type</Label>
            <Select
              value={leaveType}
              onValueChange={(v) => setLeaveType((v ?? 'casual') as LeaveType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEAVE_TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="capitalize">
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label>From</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>To</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Reason</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for leave..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!employeeId || !startDate || !endDate || !reason}
          >
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
