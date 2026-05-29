'use client'

import {
  RiAddLine,
  RiArrowRightFill,
  RiCalendarLine,
  RiPlayFill,
  RiRunLine,
} from '@remixicon/react'
import { format } from 'date-fns'
import * as React from 'react'
import { TaskRow, type TaskRowProps } from '@/components/tracks/task-row'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Progress } from '@/components/ui/progress'

export type MockSprintTask = TaskRowProps['task']

export type MockSprint = {
  id: string
  number: number
  goal: string
  startDate: number
  endDate: number
  tasks: MockSprintTask[]
}

type SprintDatePickerProps = {
  label: string
  date: Date
  onSelect: (date: Date) => void
}

function SprintDatePicker({ label, date, onSelect }: SprintDatePickerProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 px-2"
          >
            <RiCalendarLine className="size-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground group-hover/button:text-foreground">
              {format(date, 'MMM d, yyyy')}
            </span>
          </Button>
        }
      />
      <PopoverContent className="w-auto p-0" align="start" sideOffset={4}>
        <Calendar
          mode="single"
          selected={date}
          onSelect={(nextDate) => {
            if (!nextDate) return
            onSelect(nextDate)
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

type TrackSprintGroupProps = {
  sprint: MockSprint
}

export function TrackSprintGroup({ sprint }: TrackSprintGroupProps) {
  const [startDate, setStartDate] = React.useState(
    () => new Date(sprint.startDate),
  )
  const [endDate, setEndDate] = React.useState(() => new Date(sprint.endDate))
  const totalTasks = sprint.tasks.length
  const completedTasks = sprint.tasks.filter(
    (task) => task.status === 'done',
  ).length
  const progressPercent =
    totalTasks === 0 ? 0 : (completedTasks / totalTasks) * 100

  return (
    <Collapsible
      defaultOpen
      className="border-b border-border/60 last:border-b-0"
    >
      <div className="flex h-9 items-center gap-2 bg-muted/30 px-2">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 text-left text-sm">
          <CollapsibleTrigger
            className="group"
            render={<Button variant="ghost" size="icon-xs" />}
          >
            <RiPlayFill className="size-3 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:text-foreground group-data-panel-open:rotate-90" />
          </CollapsibleTrigger>
          <span className="font-semibold flex items-center gap-0.5  font-mono tracking-tighter text-xs">
            <RiRunLine className="size-4 text-muted-foreground" />
            {`Sprint ${sprint.number}`}
          </span>
          <RiArrowRightFill className="size-2.5 text-muted-foreground" />
          <span className="min-w-0 truncate text-muted-foreground">
            {sprint.goal}
          </span>
        </div>

        <div className="flex gap-2.5 items-center">
          <div className="flex items-center gap-0.5">
            <SprintDatePicker
              label="Starts on"
              date={startDate}
              onSelect={(nextDate) => {
                setStartDate(nextDate)
                if (nextDate > endDate) setEndDate(nextDate)
              }}
            />
            <RiArrowRightFill className="size-2.5 text-muted-foreground" />
            <SprintDatePicker
              label="Ends on"
              date={endDate}
              onSelect={(nextDate) => {
                setEndDate(nextDate)
                if (nextDate < startDate) setStartDate(nextDate)
              }}
            />
          </div>
          <div className="flex gap-2.5 items-center">
            <span className="text-xs tabular-nums text-muted-foreground">
              {progressPercent.toFixed(0)}%
            </span>
            <Progress value={progressPercent} className={'w-20 min-w-20'} />
            <span className="text-xs tabular-nums text-muted-foreground">
              {completedTasks}/{totalTasks}
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground"
          >
            <RiAddLine className="size-4" />
          </Button>
        </div>
      </div>

      <CollapsibleContent>
        {sprint.tasks.map((task) => (
          <TaskRow key={task._id} task={task} showMembers={false} />
        ))}
      </CollapsibleContent>
    </Collapsible>
  )
}
