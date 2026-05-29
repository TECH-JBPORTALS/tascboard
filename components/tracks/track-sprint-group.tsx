'use client'

import {
  RiAddLine,
  RiArrowRightFill,
  RiRunLine,
  RiTriangleFill,
} from '@remixicon/react'
import { startOfDay } from 'date-fns'
import * as React from 'react'
import { CreateTaskDialog } from '@/components/tasks/create-task-dialog'
import { SprintDatePicker } from '@/components/tracks/sprint-date-picker'
import { SprintGoalInput } from '@/components/tracks/sprint-goal-input'
import {
  SprintStatusIcon,
  SprintStatusPicker,
} from '@/components/tracks/sprint-status-picker'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Progress } from '@/components/ui/progress'
import { api } from '@/convex/_generated/api'
import type { Doc, Id } from '@/convex/_generated/dataModel'
import { useSprintUpdate } from '@/hooks/use-sprint-update'
import { useQuery } from 'convex-helpers/react/cache/hooks'
import { TaskRow } from './task-row'

export type Sprint = (typeof api.sprint.listByTrack._returnType)[number]

type TrackSprintGroupProps = {
  sprint: Sprint
  track: Doc<'tracks'>
  projectId: Id<'projects'>
}

export function TrackSprintGroup({
  sprint,
  track,
  projectId,
}: TrackSprintGroupProps) {
  const [createOpen, setCreateOpen] = React.useState(false)
  const {
    handleGoalSave,
    handleStartDateSelect,
    handleEndDateSelect,
    handleStatusSelect,
  } = useSprintUpdate(sprint)

  const startDate = new Date(sprint.startDate)
  const endDate = new Date(sprint.endDate)
  const totalTasks = 10
  const completedTasks = 8
  const progressPercent =
    totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

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
            <RiTriangleFill className="size-1.5 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:text-foreground rotate-90 group-data-panel-open:rotate-180" />
          </CollapsibleTrigger>
          <span className="flex shrink-0 gap-2 items-center  font-mono text-xs font-semibold tracking-tighter">
            <SprintStatusPicker
              value={sprint.status}
              onSelect={handleStatusSelect}
              trigger={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0 font-normal"
                >
                  <SprintStatusIcon
                    status={sprint.status}
                    className="size-3.5"
                  />
                </Button>
              }
            />
            {`Sprint ${sprint.sprintNumber}`}
          </span>
          <RiArrowRightFill className="size-2.5 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <SprintGoalInput
              value={sprint.goal}
              onSave={handleGoalSave}
              placeholder="Sprint goal"
              className="text-muted-foreground hover:text-foreground"
            />
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-0.5">
            <SprintDatePicker
              date={startDate}
              onSelect={handleStartDateSelect}
            />
            <RiArrowRightFill className="size-2.5 text-muted-foreground" />
            <SprintDatePicker
              date={endDate}
              onSelect={handleEndDateSelect}
              disabledDates={(date) =>
                startOfDay(date) <= startOfDay(startDate)
              }
            />
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-xs tabular-nums text-muted-foreground">
              {progressPercent.toFixed(0)}%
            </span>
            <Progress value={progressPercent} className="w-20 min-w-20" />
            <span className="text-xs tabular-nums text-muted-foreground">
              {completedTasks}/{totalTasks}
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground"
            onClick={() => setCreateOpen(true)}
            aria-label={`Add issue to Sprint ${sprint.sprintNumber}`}
          >
            <RiAddLine className="size-4" />
          </Button>
        </div>
      </div>

      <CollapsibleContent>
        <SprintTasks sprintId={sprint._id} trackId={track._id} />
      </CollapsibleContent>

      <CreateTaskDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        track={track}
        projectId={projectId}
        sprintId={sprint._id}
      />
    </Collapsible>
  )
}

function SprintTasks({
  sprintId,
  trackId,
}: {
  sprintId: Id<'sprints'>
  trackId: Id<'tracks'>
}) {
  const sprintTasks = useQuery(api.task.list, { trackId, sprintId })

  return (
    <div>
      {sprintTasks?.map((task) => (
        <TaskRow key={task._id} task={task} showSprint />
      ))}
    </div>
  )
}
