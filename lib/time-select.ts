export const TIME_SELECT_INTERVAL_MINUTES = 30

const TIME_OPTIONS = buildTimeOptions()

function buildTimeOptions(): string[] {
  const options: string[] = []
  for (
    let minutes = 0;
    minutes < 24 * 60;
    minutes += TIME_SELECT_INTERVAL_MINUTES
  ) {
    options.push(formatMinutesTo12Hour(minutes))
  }
  return options
}

export function getTimeOptions(): readonly string[] {
  return TIME_OPTIONS
}

export function formatMinutesTo12Hour(minutes: number): string {
  const hours24 = Math.floor(minutes / 60) % 24
  const mins = minutes % 60
  const period = hours24 >= 12 ? 'PM' : 'AM'
  let hours12 = hours24 % 12
  if (hours12 === 0) hours12 = 12
  return `${hours12}:${String(mins).padStart(2, '0')} ${period}`
}

function toMinutesFromParts(
  hours12: number,
  minutes: number,
  period: string,
): number | null {
  if (hours12 < 1 || hours12 > 12 || minutes < 0 || minutes > 59) {
    return null
  }

  let hours24 = hours12 % 12
  if (period === 'pm') {
    hours24 += 12
  }

  return hours24 * 60 + minutes
}

export function parseTimeInput(input: string): number | null {
  const normalized = input
    .trim()
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/\s+/g, ' ')

  if (!normalized) return null

  const withMinutes = normalized.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/)
  if (withMinutes) {
    return toMinutesFromParts(
      Number(withMinutes[1]),
      Number(withMinutes[2]),
      withMinutes[3]!,
    )
  }

  const withoutMinutes = normalized.match(/^(\d{1,2})\s*(am|pm)$/)
  if (withoutMinutes) {
    return toMinutesFromParts(Number(withoutMinutes[1]), 0, withoutMinutes[2]!)
  }

  const twentyFourHour = normalized.match(/^(\d{1,2}):(\d{2})$/)
  if (twentyFourHour) {
    const hours = Number(twentyFourHour[1])
    const minutes = Number(twentyFourHour[2])
    if (hours >= 0 && hours < 24 && minutes >= 0 && minutes <= 59) {
      return hours * 60 + minutes
    }
  }

  return null
}

export function normalizeTimeInput(input: string): string | null {
  const minutes = parseTimeInput(input)
  if (minutes === null) return null
  return formatMinutesTo12Hour(minutes)
}

export function timestampToTimeLabel(timestamp: number): string {
  const date = new Date(timestamp)
  return formatMinutesTo12Hour(date.getHours() * 60 + date.getMinutes())
}

export function timeLabelToTimestamp(
  timeLabel: string,
  referenceDate: Date = new Date(),
): number | null {
  const minutes = parseTimeInput(timeLabel)
  if (minutes === null) return null

  const date = new Date(referenceDate)
  date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0)
  return date.getTime()
}

export function isEndTimeAfterStartTime(startTime: string, endTime: string) {
  const startMinutes = parseTimeInput(startTime)
  const endMinutes = parseTimeInput(endTime)
  if (startMinutes === null || endMinutes === null) return false
  return endMinutes > startMinutes
}

export function isValidTimeInput(input: string) {
  return parseTimeInput(input) !== null
}
