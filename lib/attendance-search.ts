import { parseAsString } from 'nuqs'

export const attendanceSearchParser = parseAsString.withDefault('').withOptions({
  clearOnDefault: true,
})

export function filterAttendanceByEmployeeName<
  T extends { employee: { user: { name: string } } },
>(rows: T[], query: string): T[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return rows

  return rows.filter((row) =>
    row.employee.user.name.toLowerCase().includes(normalized),
  )
}
