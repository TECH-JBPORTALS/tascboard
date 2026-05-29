'use client'

import { useQuery } from 'convex/react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { TaskDetailView } from '@/components/tasks/task-details-view'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'

export default function TaskDetailPage() {
  const params = useParams<{
    orgSlug: string
    projectId: string
    trackId: string
    taskId: string
  }>()

  const taskId = params.taskId as Id<'tasks'>
  const trackId = params.trackId as Id<'tracks'>
  const projectId = params.projectId as Id<'projects'>

  const task = useQuery(api.task.get, { taskId })

  if (task === undefined) {
    return <TaskDetailSkeleton />
  }

  if (task === null) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-muted-foreground">Task not found.</p>
        <Button
          render={
            <Link
              href={`/${params.orgSlug}/pro/${projectId}/track/${trackId}`}
            />
          }
        >
          Back to track
        </Button>
      </div>
    )
  }

  if (task.trackId !== trackId || task.projectId !== projectId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-muted-foreground">
          This task does not belong to this track.
        </p>
        <Button
          render={
            <Link
              href={`/${params.orgSlug}/pro/${projectId}/track/${trackId}`}
            />
          }
        >
          Back to track
        </Button>
      </div>
    )
  }

  return <TaskDetailView orgSlug={params.orgSlug} task={task} />
}

function TaskDetailSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className={`border-b border-border/60 px-4 h-(--header-height)`}>
        <div className="flex h-full items-center gap-3">
          <Skeleton className="size-8 rounded-lg" />
          <div className="space-y-1">
            <Skeleton className="h-3 w-52" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
      </div>
      <div className="space-y-4 p-8">
        <Skeleton className="h-10 w-full max-w-xl" />
        <Skeleton className="min-h-[200px] w-full" />
      </div>
    </div>
  )
}
