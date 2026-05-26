'use client'

import { useMutation, useQuery } from 'convex/react'
import { useParams } from 'next/navigation'
import { ScrollArea } from '@/components/ui/scroll-area'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { useProjectDetailPanel } from '@/hooks/use-project-detail-panel'
import {
  DEFAULT_PROJECT_COLOR,
  DEFAULT_PROJECT_ICON,
} from '@/lib/project-appearance'
import { cn } from '@/lib/utils'
import { TitleInput } from '../TitleInput'
import { ProjectTracksSection } from '../tracks/project-tracks-section'
import { ProjectDescription } from './ProjectDescription'
import { ProjectIconPicker } from './ProjectIconPicker'
import { ProjectPageHeader } from './ProjectPageHeader'
import { ProjectProperties } from './ProjectProperties'
import { ProjectRightBar, ProjectRightBarToggle } from './ProjectRightBar'
import { ProjectSummary } from './ProjectSummary'

export function ProjectDetailsPage() {
  const { projectId, orgSlug } = useParams<{
    projectId: Id<'projects'>
    orgSlug: string
  }>()
  const project = useQuery(api.project.get, { projectId })
  const updateProject = useMutation(api.project.update)
  const { open, toggle, setOpen, hydrated } = useProjectDetailPanel()
  const isRightBarOpen = hydrated ? open : false

  if (typeof project === 'undefined') return <div>Loading...</div>

  if (project === null) return <div>Project not found</div>

  return (
    <>
      <ProjectPageHeader
        projectName={project.name ?? ''}
        icon={project.icon ?? DEFAULT_PROJECT_ICON}
        color={project.color ?? DEFAULT_PROJECT_COLOR}
        orgSlug={orgSlug}
        actions={
          <ProjectRightBarToggle open={isRightBarOpen} onToggle={toggle} />
        }
      />
      <div className="flex h-full max-h-[calc(100vh-var(--header-height))] min-h-0 flex-1 overflow-hidden">
        <div className="flex h-full min-h-0 flex-1 flex-col  @container/main  overflow-hidden">
          <ScrollArea className="min-h-0 flex-1 px-72 @max-6xl/main:px-20">
            <div
              className={cn(
                'mx-auto w-full py-6 space-y-4 transition-[padding] duration-200',
              )}
            >
              <div className="flex items-center gap-2.5">
                <ProjectIconPicker
                  size="md"
                  icon={project.icon ?? DEFAULT_PROJECT_ICON}
                  color={project.color ?? DEFAULT_PROJECT_COLOR}
                  onIconChange={(icon) =>
                    updateProject({ projectId, body: { icon } })
                  }
                  onColorChange={(color) =>
                    updateProject({ projectId, body: { color } })
                  }
                />
                <TitleInput
                  value={project.name ?? ''}
                  placeholder="Project title"
                  className="pb-0 sm:pb-0"
                  onSave={(value) =>
                    updateProject({ projectId, body: { name: value } })
                  }
                />
              </div>
              <ProjectSummary
                projectId={projectId}
                summary={project.summary ?? ''}
              />
              <ProjectProperties
                _id={projectId}
                startDate={project.startDate ?? 0}
                endDate={project.endDate ?? 0}
                status={project.status ?? 'active'}
                manager={project.manager}
                members={project.members}
              />
              <ProjectDescription projectId={projectId} />
              <ProjectTracksSection projectId={projectId} orgSlug={orgSlug} />
            </div>
          </ScrollArea>
        </div>
        <ProjectRightBar
          projectId={projectId}
          open={isRightBarOpen}
          onClose={() => setOpen(false)}
        />
      </div>
    </>
  )
}
