import { ScheduleDetailPage } from '@/components/meetings'
import type { Id } from '@/convex/_generated/dataModel'

export default async function MeetingSchedulePage({
  params,
}: {
  params: Promise<{ scheduleId: string }>
}) {
  const { scheduleId } = await params

  return <ScheduleDetailPage scheduleId={scheduleId as Id<'scheduleMeeting'>} />
}
