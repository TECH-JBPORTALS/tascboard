import { Protect } from '@/components/auth/protect'
import { AttendanceHeader } from '@/components/common/attendance-header'
import {
  LeaveRequestsEmployee,
  LeaveRequestsOwner,
} from '@/components/leave-requests'

export default function LeaveRequestsPage() {
  return (
    <div>
      <AttendanceHeader />
      <Protect permissions={{ attendance: ['delete', 'edit'] }}>
        <LeaveRequestsOwner />
      </Protect>
      <Protect permissions={{ attendance: ['personal'] }}>
        <LeaveRequestsEmployee />
      </Protect>
    </div>
  )
}
