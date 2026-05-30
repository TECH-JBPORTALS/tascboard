'use client'

import { format } from 'date-fns'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface MeetingTimeInputsProps {
  endTime: number
  onEndChange: (ts: number) => void
  onStartChange: (ts: number) => void
  startTime: number
}

const toLocal = (ts: number) => format(new Date(ts), "yyyy-MM-dd'T'HH:mm")
const fromLocal = (s: string) => new Date(s).getTime()

export function MeetingTimeInputs({
  endTime,
  onEndChange,
  onStartChange,
  startTime,
}: MeetingTimeInputsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="flex flex-col gap-1.5">
        <Label>Start Time</Label>
        <Input
          type="datetime-local"
          value={toLocal(startTime)}
          onChange={(e) => onStartChange(fromLocal(e.target.value))}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>End Time</Label>
        <Input
          type="datetime-local"
          value={toLocal(endTime)}
          onChange={(e) => onEndChange(fromLocal(e.target.value))}
        />
      </div>
    </div>
  )
}