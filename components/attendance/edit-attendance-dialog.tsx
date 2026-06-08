'use client'

import { useMutation } from 'convex/react'
import { useEffect, useState } from 'react'

import { TimePickerInput } from '@/components/meetings/time-picker'
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
import type { AttendanceRecord, AttendanceStatus } from '@/lib/attendance-types'

type Props = {
  record: AttendanceRecord | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const STATUSES: AttendanceStatus[] = ['present', 'late', 'half day', 'on leave']

export function EditAttendanceDialog({ record, open, onOpenChange }: Props) {
  const update = useMutation(api.attendance.updateAttendance)
  const [status, setStatus] = useState<AttendanceStatus>('present')
  const [loginHour, setLoginHour] = useState(9)
  const [loginMinute, setLoginMinute] = useState(0)
  const [logoutHour, setLogoutHour] = useState(18)
  const [logoutMinute, setLogoutMinute] = useState(0)
  const [hasLogout, setHasLogout] = useState(false)

  useEffect(() => {
    if (!record) return
    setStatus(record.status)
    const login = new Date(record.loginTime)
    setLoginHour(login.getHours())
    setLoginMinute(login.getMinutes())
    if (record.logoutTime) {
      const logout = new Date(record.logoutTime)
      setLogoutHour(logout.getHours())
      setLogoutMinute(logout.getMinutes())
      setHasLogout(true)
    } else {
      setHasLogout(false)
    }
  }, [record])

  const handleSave = async () => {
    if (!record) return
    const base = record.recordDate
    const loginTs = new Date(base)
    loginTs.setHours(loginHour, loginMinute, 0, 0)
    const logoutTs = hasLogout ? new Date(base) : null
    if (logoutTs) logoutTs.setHours(logoutHour, logoutMinute, 0, 0)

    await update({
      attendanceId: record._id,
      body: {
        status,
        loginTime: loginTs.getTime(),
        logoutTime: logoutTs?.getTime() ?? undefined,
      },
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Attendance</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
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

          <div className="space-y-1.5">
            <Label>Check In</Label>
            <TimePickerInput
              hour={loginHour}
              minute={loginMinute}
              onChange={(h, m) => {
                setLoginHour(h)
                setLoginMinute(m)
              }}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Check Out</Label>
            <TimePickerInput
              hour={logoutHour}
              minute={logoutMinute}
              onChange={(h, m) => {
                setLogoutHour(h)
                setLogoutMinute(m)
                setHasLogout(true)
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
