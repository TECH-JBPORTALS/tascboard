'use client'
import { RiArrowLeftSLine } from '@remixicon/react'
import { useQuery } from 'convex-helpers/react/cache/hooks'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { ProjectIcon } from '../projects/project-icon'
import { Button } from '../ui/button'

/** This component only meant to use within the project -> settings page */
export function BackToProjectButton({ projectId }: { projectId: string }) {
  const project = useQuery(api.project.get, {
    projectId: projectId as Id<'projects'>,
  })
  const { orgSlug } = useParams<{ orgSlug: string }>()
  const href = `/${orgSlug}/settings/${projectId}`
  const router = useRouter()

  if (!project) return null

  return (
    <Button
      variant={'ghost'}
      size={'lg'}
      className={'absolute top-3.5  left-3.5 rounded-full'}
      onClick={() => router.push(href, { transitionTypes: ['popstate'] })}
    >
      <RiArrowLeftSLine className=" text-muted-foreground" />
      <ProjectIcon
        className="size-5 text-xs"
        icon={project.icon}
        color={project.color}
      />
      <span>{project.name}</span>
    </Button>
  )
}
