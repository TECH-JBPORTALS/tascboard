'use client'

import { format } from 'date-fns'

import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { type MeetingRow, RECURRENCE_LABELS } from '@/lib/meeting-types'
import { MeetingRowActions } from './meeting-row-actions'

interface MeetingListProps {
  meetings: MeetingRow[]
  onViewSchedules: (meeting: MeetingRow) => void
}

export function MeetingList({ meetings, onViewSchedules }: MeetingListProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Start</TableHead>
          <TableHead>End</TableHead>
          <TableHead>Recurrence</TableHead>
          <TableHead>Link</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {meetings.map((m) => (
          <TableRow
            key={m._id}
            className="cursor-pointer"
            onClick={() => onViewSchedules(m)}
          >
            <TableCell>
              <p className="text-sm font-medium">{m.title}</p>
              {m.description ? (
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {m.description}
                </p>
              ) : null}
            </TableCell>
            <TableCell className="text-sm">
              {format(new Date(m.startTime), 'PPp')}
            </TableCell>
            <TableCell className="text-sm">
              {format(new Date(m.endTime), 'p')}
            </TableCell>
            <TableCell>
              <Badge variant="outline">
                {RECURRENCE_LABELS[m.recurrenceType]}
              </Badge>
            </TableCell>
            <TableCell>
              <a
                href={m.meetingLink}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary underline underline-offset-4"
                onClick={(e) => e.stopPropagation()}
              >
                Join
              </a>
            </TableCell>
            <TableCell onClick={(e) => e.stopPropagation()}>
              <MeetingRowActions
                meetingId={m._id}
                onViewSchedules={() => onViewSchedules(m)}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}