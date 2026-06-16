import { Protect } from '@/components/auth/protect'
import { AttendanceHeader } from '@/components/common/attendance-header'
import { MonthlyAttendance } from '@/components/monthly-attendance'
import { MonthlyAttendanceShell } from '@/components/monthly-attendance/shell'

export default function MonthlyAttendancePage() {
  return (
    <div>
      <AttendanceHeader />
      <Protect permissions={{ attendance: ['delete', 'edit'] }}>
        <MonthlyAttendanceShell>
          <MonthlyAttendance />
        </MonthlyAttendanceShell>
      </Protect>
    </div>
  )
}
