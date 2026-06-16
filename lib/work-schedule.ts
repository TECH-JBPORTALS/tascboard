export type DayWorkSchedule = {
  enabled: boolean
  startTime: string
  endTime: string
}

function timeOnDate(referenceDate: number, time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  const date = new Date(referenceDate)
  date.setHours(hours ?? 0, minutes ?? 0, 0, 0)
  return date.getTime()
}

export function scheduledDurationMs(
  referenceDate: number,
  schedule: DayWorkSchedule,
): number {
  return (
    timeOnDate(referenceDate, schedule.endTime) -
    timeOnDate(referenceDate, schedule.startTime)
  )
}

/** True when worked hours are less than the org schedule for that day. */
export function isUnderScheduledHours(
  loginTime: number,
  logoutTime: number,
  schedule: DayWorkSchedule,
): boolean {
  if (!schedule.enabled) return false

  const workedMs = logoutTime - loginTime
  const scheduledMs = scheduledDurationMs(loginTime, schedule)

  return workedMs < scheduledMs
}
