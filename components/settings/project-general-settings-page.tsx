'use client'

import { useMutation } from 'convex/react'
import { useQuery } from 'convex-helpers/react/cache/hooks'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ProjectIconPicker } from '@/components/projects/project-icon-picker'
import { ProjectMangerPicker } from '@/components/projects/project-manager-picker'
import { ProjectMembersPicker } from '@/components/projects/project-members-picker'
import { DeleteProjectSection } from '@/components/settings/delete-project-section'
import {
  Field,
  FieldDescription,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import {
  DEFAULT_PROJECT_COLOR,
  DEFAULT_PROJECT_ICON,
} from '@/lib/project-appearance'
import { Card, CardContent } from '../ui/card'
import { Spinner } from '../ui/spinner'

export function ProjectGeneralSettingsPage() {
  const { projectId } = useParams<{ projectId: Id<'projects'> }>()
  const project = useQuery(api.project.get, { projectId })
  const updateProject = useMutation(api.project.update)
  const [name, setName] = useState('')
  const [isSavingName, setIsSavingName] = useState(false)

  useEffect(() => {
    if (project?.name !== undefined) {
      setName(project.name)
    }
  }, [project?.name])

  async function handleSaveName() {
    const trimmed = name.trim()
    if (!trimmed) {
      toast.error('Project name is required')
      return
    }

    setIsSavingName(true)
    try {
      await updateProject({ projectId, body: { name: trimmed } })
      toast.success('Project name updated')
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to update project name',
      )
    } finally {
      setIsSavingName(false)
    }
  }

  if (project === undefined) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <Skeleton className="h-7 w-32" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <Card>
          <CardContent className="space-y-6">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (project === null) {
    return (
      <div className="text-sm text-muted-foreground">Project not found</div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">General</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage {project.name}&apos;s icon, name, manager, and members.
        </p>
      </div>

      <Card>
        <CardContent>
          <FieldSet className="grid grid-cols-4">
            <div className="col-span-3">
              <FieldLegend>Icon</FieldLegend>
              <FieldDescription>
                The icon and color shown for this project across the app.
              </FieldDescription>
            </div>
            <div className="col-span-1 flex items-center justify-end">
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
            </div>
          </FieldSet>
        </CardContent>

        <Separator />

        <CardContent>
          <FieldSet className="grid grid-cols-6">
            <div className="col-span-4">
              <FieldLegend>Name</FieldLegend>
              <FieldDescription>
                The display name for this project.
              </FieldDescription>
            </div>
            <Field className="col-span-2 flex-row items-center justify-end">
              <InputGroup className="flex-1">
                <InputGroupInput
                  id="project-name"
                  value={name}
                  disabled={isSavingName}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Project name"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      void handleSaveName()
                    }
                  }}
                />
                <InputGroupAddon align="inline-end">
                  {isSavingName ? <Spinner className="size-2.5" /> : null}
                </InputGroupAddon>
              </InputGroup>
            </Field>
          </FieldSet>
        </CardContent>

        <Separator />

        <CardContent>
          <FieldSet className="grid grid-cols-6">
            <div className="col-span-4">
              <FieldLegend>Manager</FieldLegend>
              <FieldDescription>
                The person responsible for this project.
              </FieldDescription>
            </div>
            <div className="col-span-2 flex items-center justify-end">
              <ProjectMangerPicker
                projectId={projectId}
                manager={project.manager}
              />
            </div>
          </FieldSet>
        </CardContent>

        <Separator />

        <CardContent>
          <FieldSet className="grid grid-cols-6">
            <div className="col-span-4">
              <FieldLegend>Members</FieldLegend>
              <FieldDescription>
                People who can access and work on this project.
              </FieldDescription>
            </div>
            <div className="col-span-2 flex items-center justify-end">
              <ProjectMembersPicker projectId={projectId} />
            </div>
          </FieldSet>
        </CardContent>
      </Card>

      <DeleteProjectSection
        projectId={projectId}
        projectName={project.name ?? ''}
      />
    </div>
  )
}
