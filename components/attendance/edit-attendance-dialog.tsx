'use client'

import { useMutation } from 'convex/react'
import { useEffect, useState } from 'react'
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
import { api } from '@/convex/_generated/api'
import type { AttendanceRecord, AttendanceStatus } from '@/lib/attendance-types'

type Props = { record: AttendanceRecord | null; open: boolean; onOpenChange: (open: boolean) => void }

const STATUSES: AttendanceStatus[] = ['present', 'late', 'half day', 'on leave']

function toTimeInput(ts?: number): string {
  if (!ts) return ''
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function toTimestamp(base: number, t: string): number {
  const [h, m] = t.split(':').map(Number)
  const d = new Date(base)
  d.setHours(h, m, 0, 0)
  return d.getTime()
}

export function EditAttendanceDialog({ record, open, onOpenChange }: Props) {
  const update = useMutation(api.attendance.updateAttendance)
  const [status, setStatus] = useState<AttendanceStatus>('present')
  const [loginTime, setLoginTime] = useState('')
  const [logoutTime, setLogoutTime] = useState('')

  useEffect(() => {
    if (!record) return
    setStatus(record.status)
    setLoginTime(toTimeInput(record.loginTime))
    setLogoutTime(toTimeInput(record.logoutTime))
  }, [record])

  const handleSave = async () => {
    if (!record) return
    await update({
      attendanceId: record._id,
      body: {
        status,
        loginTime: loginTime ? toTimestamp(record.recordDate, loginTime) : undefined,
        logoutTime: logoutTime ? toTimestamp(record.recordDate, logoutTime) : undefined,
      },
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-sm'>
        <DialogHeader><DialogTitle>Edit Attendance</DialogTitle></DialogHeader>
        <div className='space-y-4 py-2'>
          <div className='space-y-1.5'>
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus((v ?? 'present') as AttendanceStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className='capitalize'>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='space-y-1.5'>
            <Label>Check In</Label>
            <Input type='time' value={loginTime} onChange={(e) => setLoginTime(e.target.value)} />
          </div>
          <div className='space-y-1.5'>
            <Label>Check Out</Label>
            <Input type='time' value={logoutTime} onChange={(e) => setLogoutTime(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}