import { addDays, startOfDay } from 'date-fns'

export function getLeaveDays(start: number, end: number) {
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1
}

export function getUsedApprovedLeaves(
  requests: Array<{ status: string; startDate: number; endDate: number }>,
  year?: number,
) {
  const approved = requests.filter((request) => {
    if (request.status !== 'approved') return false
    if (year === undefined) return true
    return new Date(request.startDate).getFullYear() === year
  })

  let used = 0
  for (const request of approved) {
    used += getLeaveDays(request.startDate, request.endDate)
  }
  return used
}

export function normalizeLeaveDate(date: number) {
  return startOfDay(new Date(date)).getTime()
}

export function validateAdvanceNotice(startDate: number, now: number) {
  const earliestStart = startOfDay(addDays(new Date(now), 1)).getTime()
  if (startDate < earliestStart) {
    throw new Error('Leave must be requested at least one day in advance')
  }
}

export function splitLeaveDaysByYear(startDate: number, endDate: number) {
  const daysByYear = new Map<number, number>()
  let cursor = normalizeLeaveDate(startDate)
  const end = normalizeLeaveDate(endDate)

  while (cursor <= end) {
    const year = new Date(cursor).getFullYear()
    daysByYear.set(year, (daysByYear.get(year) ?? 0) + 1)
    cursor = startOfDay(addDays(new Date(cursor), 1)).getTime()
  }

  return daysByYear
}

export function validateRaiseAgainstQuota({
  requests,
  startDate,
  endDate,
  quotasByYear,
}: {
  requests: Array<{ status: string; startDate: number; endDate: number }>
  startDate: number
  endDate: number
  quotasByYear: Map<number, number>
}) {
  if (endDate < startDate) {
    throw new Error('Invalid date range')
  }

  const requestDaysByYear = splitLeaveDaysByYear(startDate, endDate)

  for (const [year, requestDays] of requestDaysByYear) {
    const leaveQuota = quotasByYear.get(year)
    if (leaveQuota === undefined) {
      throw new Error(`Leave quota not configured for ${year}`)
    }

    const used = getUsedApprovedLeaves(requests, year)
    if (used >= leaveQuota) {
      throw new Error(`No leave balance remaining for ${year}`)
    }

    const remaining = leaveQuota - used
    if (requestDays > remaining) {
      throw new Error(
        `You only have ${remaining} leave days remaining for ${year}`,
      )
    }
  }

  const primaryYear = new Date(startDate).getFullYear()
  const leaveQuota = quotasByYear.get(primaryYear) ?? 0
  const used = getUsedApprovedLeaves(requests, primaryYear)
  const remaining = leaveQuota - used

  return {
    requestDays: getLeaveDays(startDate, endDate),
    remaining,
  }
}
