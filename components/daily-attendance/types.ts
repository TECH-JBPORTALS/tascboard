import { api } from '@/convex/_generated/api'

export type AttendanceEmployeeRow =
  (typeof api.attendance.listForEmployeesInDateRange._returnType)[number]

export type AttendanceDayCell = AttendanceEmployeeRow['attendance'][string]

export type SelectedAttendanceDay = {
  employeeId: string
  employeeName: string
  day: Date
  dayAttendance: AttendanceDayCell
}
