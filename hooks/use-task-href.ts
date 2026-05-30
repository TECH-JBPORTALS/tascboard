'use client'

import { useParams } from 'next/navigation'
import type { Id } from '@/convex/_generated/dataModel'

export function useTaskHref(taskId: Id<'tasks'>) {
  const params = useParams<{
    orgSlug: string
    projectId: string
    trackId: string
  }>()

  return `/${params.orgSlug}/pro/${params.projectId}/track/${params.trackId}/task/${taskId}`
}
