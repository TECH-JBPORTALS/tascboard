'use client'

import { useMutation } from 'convex/react'
import { useMemo, useRef, useState } from 'react'
import { DataTable } from '@/components/data-table'
import { api } from '@/convex/_generated/api'
import type {
  AttendanceRecord,
  AttendanceStatus,
  DailyRow,
  EmployeeRef,
  EnrichedAttendance,
} from '@/lib/attendance-types'
import { buildDailyColumns } from './daily-columns'
import { EditAttendanceDialog } from './edit-attendance-dialog'

const HALF_DAY_MS = 4 * 60 * 60 * 1000

type Props = {
  employees: EmployeeRef[]
  recordDate: number
  records: AttendanceRecord[]
}

export function DailyTable({ employees, recordDate, records }: Props) {
  const [editRecord, setEditRecord] = useState<EnrichedAttendance | null>(null)
  const [editOpen, setEditOpen] = useState(false)

  const create = useMutation(api.attendance.createAttendance)
  const update = useMutation(api.attendance.updateAttendance)

  const handleEdit = (row: DailyRow) => {
    if (!row.record) return
    setEditRecord({ ...row.record, employee: row.employee })
    setEditOpen(true)
  }

  const handleEditRef = useRef(handleEdit)
  handleEditRef.current = handleEdit

  const columns = useMemo(
    () => buildDailyColumns((row) => handleEditRef.current(row)),
    [],
  )

  const data: DailyRow[] = useMemo(
    () =>
      employees.map((employee) => {
        const record = records.find((r) => r.employeeId === employee.id)
        return {
          employee,
          onCreate: async (
            employeeId: string,
            date: number,
            status: AttendanceStatus,
          ) => {
            await create({
              employeeId,
              loginTime: Date.now(),
              recordDate: date,
              status,
            })
          },
          onCheckOut: async () => {
            if (!record) return
            const now = Date.now()
            const elapsed = now - record.loginTime
            await update({
              attendanceId: record._id,
              body: {
                logoutTime: now,
                status: elapsed < HALF_DAY_MS ? 'half day' : record.status,
              },
            })
          },
          record,
          recordDate,
        }
      }),
    [employees, records, recordDate, create, update],
  )

  return (
    <>
      <DataTable columns={columns} data={data} />
      <EditAttendanceDialog
        onOpenChange={setEditOpen}
        open={editOpen}
        record={editRecord}
      />
    </>
  )
}
