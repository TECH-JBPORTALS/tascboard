import { Protect } from '@/components/auth/protect'
import { AttendanceHeader } from '@/components/common/attendance-header'
import { Attendance } from '@/components/daily-attendance'
import { MyAttendance, TodayAttendance } from '@/components/my-attendance'

export default function Page() {
  return (
    <div>
      <AttendanceHeader />
      <Protect permissions={{ attendance: ['personal'] }}>
        <div className="px-6 pt-4">
          <TodayAttendance />
        </div>
        <MyAttendance />
      </Protect>
      <Protect permissions={{ attendance: ['delete', 'edit'] }}>
        <Attendance />
      </Protect>
    </div>
  )
}
