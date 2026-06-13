import { useEffect, useState } from 'react'

type FormatElapsedDurationOptions = {
  showSeconds?: boolean
}

function formatHoursLabel(hours: number): string {
  return hours === 1 ? '1 Hour' : `${hours} Hours`
}

function formatMinutesLabel(minutes: number): string {
  return minutes === 1 ? '1 Minute' : `${minutes} Minutes`
}

export function formatElapsedDuration(
  elapsedMs: number,
  options?: FormatElapsedDurationOptions,
): string {
  const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (options?.showSeconds) {
    if (hours === 0) {
      return `${minutes}m ${seconds}s`
    }

    if (minutes === 0 && seconds === 0) {
      return formatHoursLabel(hours)
    }

    if (minutes === 0) {
      return `${hours}h ${seconds}s`
    }

    if (seconds === 0) {
      return `${hours}h ${minutes}m`
    }

    return `${hours}h ${minutes}m ${seconds}s`
  }

  if (hours === 0) {
    return formatMinutesLabel(minutes)
  }

  if (minutes === 0) {
    return formatHoursLabel(hours)
  }

  return `${hours}h ${minutes}m`
}

export function AttendanceTimeTicker({
  loginTime,
  showSeconds = false,
}: {
  loginTime: number
  showSeconds?: boolean
}) {
  const [elapsedMs, setElapsedMs] = useState(() => Date.now() - loginTime)

  useEffect(() => {
    const tick = () => setElapsedMs(Date.now() - loginTime)

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [loginTime])

  return (
    <span className="tabular-nums font-mono">
      {formatElapsedDuration(elapsedMs, { showSeconds })}
    </span>
  )
}
