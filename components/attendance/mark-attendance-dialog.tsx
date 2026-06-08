'use client'

import { RiAddLargeFill } from '@remixicon/react'
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
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { api } from '@/convex/_generated/api'
import type { AttendanceStatus, EmployeeRef } from '@/lib/attendance-types'

type Props = { employees: EmployeeRef[]; recordDate: number }

const STATUSES: AttendanceStatus[] = ['present', 'late', 'half day', 'on leave']

export function MarkAttendanceDialog({ employees, recordDate }: Props) {
  const [open, setOpen] = useState(false)
  const [employeeId, setEmployeeId] = useState('')
  const [status, setStatus] = useState<AttendanceStatus>('present')
  const create = useMutation(api.attendance.createAttendance)

  const handleSubmit = async () => {
    if (!employeeId) return
    await create({ employeeId, recordDate, loginTime: Date.now(), status })
    setEmployeeId('')
    setStatus('present')
    setOpen(false)
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <RiAddLargeFill className="size-4" />
        Mark Attendance
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Mark Attendance</DialogTitle>
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
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(v) =>
                  setStatus((v ?? 'present') as AttendanceStatus)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!employeeId}>
              Mark
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
