import {
  type AttendanceRecord,
  type EmployeeRef,
  getElapsedWorkingDays,
} from '@/lib/attendance-types'

function fmt(ts: number, type: 'date' | 'time'): string {
  return type === 'date'
    ? new Date(ts).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : new Date(ts).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
}

const BASE_STYLE = `body{font-family:sans-serif;padding:24px;color:#111}h2{margin-bottom:4px}
p.sub{margin:0 0 16px;color:#555;font-size:13px}table{width:100%;border-collapse:collapse}
th,td{border:1px solid #ddd;padding:8px 12px;text-align:left;font-size:13px}
th{background:#f4f4f4;font-weight:600}tr:nth-child(even){background:#fafafa}`

function printHTML(title: string, label: string, thead: string, tbody: string) {
  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
    <style>${BASE_STYLE}</style></head><body>
    <h2>Attendance Report</h2><p class="sub">${label}</p>
    <table><thead>${thead}</thead><tbody>${tbody}</tbody></table>
    </body></html>`)
  win.document.close()
  win.focus()
  win.print()
}

export function exportDailyPDF(
  records: AttendanceRecord[],
  employees: EmployeeRef[],
  date: Date,
) {
  const label = date.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const thead =
    '<tr><th>Employee</th><th>Role</th><th>Status</th><th>Check In</th><th>Check Out</th></tr>'
  const tbody = employees
    .map((emp) => {
      const r = records.find((rec) => rec.employeeId === emp.id)
      return `<tr><td>${emp.name}</td><td>${emp.role}</td><td>${r?.status ?? '—'}</td>
      <td>${r ? fmt(r.loginTime, 'time') : '—'}</td>
      <td>${r?.logoutTime ? fmt(r.logoutTime, 'time') : '—'}</td></tr>`
    })
    .join('')
  printHTML(`Daily Attendance — ${label}`, label, thead, tbody)
}

export function exportMonthlyPDF(
  records: AttendanceRecord[],
  employees: EmployeeRef[],
  year: number,
  month: number,
) {
  const label = new Date(year, month, 1).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  })
  const elapsed = getElapsedWorkingDays(year, month)
  const thead =
    '<tr><th>Employee</th><th>Role</th><th>Present</th><th>Leave Days</th><th>Attendance %</th></tr>'
  const tbody = employees
    .map((emp) => {
      const emp_records = records.filter((r) => r.employeeId === emp.id)
      const present = emp_records.filter(
        (r) => r.status === 'present' || r.status === 'late',
      ).length
      const leave = emp_records.filter(
        (r) => r.status === 'on leave' || r.status === 'half day',
      ).length
      const pct = elapsed > 0 ? Math.round((present / elapsed) * 100) : 0
      return `<tr><td>${emp.name}</td><td>${emp.role}</td><td>${present}</td><td>${leave}</td><td>${pct}%</td></tr>`
    })
    .join('')
  printHTML(`Monthly Attendance — ${label}`, label, thead, tbody)
}
