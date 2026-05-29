'use client'

import { useMutation } from 'convex/react'
import * as React from 'react'
import { TaskActivityFeed } from '@/components/tasks/task-activity-feed'
import {
  TaskRightBar,
  TaskRightBarToggle,
} from '@/components/tasks/task-detail-sidebar'
import { TaskPageHeader } from '@/components/tasks/task-page-header'
import { TaskSubtasksSection } from '@/components/tasks/task-subtask-section'
import { ScrollArea } from '@/components/ui/scroll-area'
import { api } from '@/convex/_generated/api'
import type { Doc } from '@/convex/_generated/dataModel'
import { useTaskDetailPanel } from '@/hooks/use-task-detail-panel'
import { cn } from '@/lib/utils'
import { RichTextEditor } from '../editor/rich-text-editor'
import { TitleInput } from '../title-input'

type TaskDetail = Doc<'tasks'> & {
  track: Doc<'tracks'> | null
  project: Doc<'projects'> | null
  labels: Doc<'labels'>[]
}

type TaskDetailsPageProps = {
  orgSlug: string
  task: TaskDetail
}

export function TaskDetailsPage({ orgSlug, task }: TaskDetailsPageProps) {
  const updateDescription = useMutation(api.task.updateDescription)
  const updateTask = useMutation(api.task.update)
  const { open, toggle, hydrated } = useTaskDetailPanel()
  const isRightBarOpen = hydrated ? open : false
  const [title, setTitle] = React.useState(task.title)
  const [description, setDescription] = React.useState(
    typeof task.description === 'string' ? task.description : '',
  )
  const savedDescriptionRef = React.useRef(description)

  async function saveTitle() {
    const trimmed = title.trim()
    if (!trimmed || trimmed === task.title) return
    await updateTask({
      taskId: task._id,
      body: { title: trimmed },
    })
  }

  async function saveDescription(nextMarkdown: string) {
    if (nextMarkdown === savedDescriptionRef.current) return
    savedDescriptionRef.current = nextMarkdown
    await updateDescription({ taskId: task._id, description: nextMarkdown })
  }

  const track = task.track
  const project = task.project

  if (!track || !project) {
    return (
      <p className="p-8 text-muted-foreground">Task context is unavailable.</p>
    )
  }

  return (
    <>
      <TaskPageHeader
        orgSlug={orgSlug}
        project={project}
        track={track}
        task={task}
        className="top-0 z-20"
        actions={<TaskRightBarToggle open={isRightBarOpen} onToggle={toggle} />}
      />
      <div className="flex h-full max-h-[calc(100vh-var(--header-height))] min-h-0 flex-1 overflow-hidden">
        <div className="flex h-full min-h-0 flex-1 flex-col @container/main overflow-hidden">
          <ScrollArea className="min-h-0 flex-1 px-72 @max-6xl/main:px-20">
            <div
              className={cn(
                'mx-auto w-full space-y-4 py-6 transition-[padding] duration-200',
              )}
            >
              <TitleInput
                value={title}
                placeholder="Task title"
                onChange={(value) => setTitle(value)}
                onSave={saveTitle}
              />

              <div>
                <p className="text-xs font-mono font-semibold text-muted-foreground">
                  Description
                </p>
                <RichTextEditor
                  value={description}
                  onChange={setDescription}
                  onSave={(markdown) => void saveDescription(markdown)}
                />
              </div>

              <TaskSubtasksSection taskId={task._id} />

              <TaskActivityFeed taskId={task._id} />
            </div>
          </ScrollArea>
        </div>
        <TaskRightBar
          orgSlug={orgSlug}
          task={task}
          project={project}
          labels={task.labels}
          open={isRightBarOpen}
        />
      </div>
    </>
  )
}
