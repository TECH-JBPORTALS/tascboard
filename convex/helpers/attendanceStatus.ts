import type { DayWorkSchedule } from './organizationWorkSchedule'

export type DerivedLoginStatus = 'present' | 'late'

function timeOnDate(referenceDate: number, time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  const date = new Date(referenceDate)
  date.setHours(hours ?? 0, minutes ?? 0, 0, 0)
  return date.getTime()
}

export function deriveStatusFromLogin(
  loginTime: number,
  daySchedule: DayWorkSchedule,
): DerivedLoginStatus {
  if (!daySchedule.enabled) {
    return 'present'
  }

  const scheduledStart = timeOnDate(loginTime, daySchedule.startTime)
  return loginTime > scheduledStart ? 'late' : 'present'
}
