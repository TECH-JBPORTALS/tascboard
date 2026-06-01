'use client'

import { useMutation } from 'convex/react'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Protect } from '@/components/auth/protect'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { FieldDescription, FieldLegend, FieldSet } from '@/components/ui/field'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { Card, CardContent } from '../ui/card'
import { Spinner } from '../ui/spinner'

type DeleteProjectSectionProps = {
  projectId: Id<'projects'>
  projectName: string
}

export function DeleteProjectSection({
  projectId,
  projectName,
}: DeleteProjectSectionProps) {
  const router = useRouter()
  const { orgSlug } = useParams<{ orgSlug: string }>()
  const removeProject = useMutation(api.project.remove)
  const [isDeleting, setIsDeleting] = useState(false)
  const [open, setOpen] = useState(false)

  async function handleDelete() {
    setIsDeleting(true)
    try {
      await removeProject({ projectId })
      toast.success('Project deleted')
      router.replace(`/${orgSlug}/settings`)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete project',
      )
    } finally {
      setIsDeleting(false)
      setOpen(false)
    }
  }

  return (
    <Protect permissions={{ project: ['delete'] }}>
      <div className="flex flex-col gap-3">
        <div>
          <h2 className=" font-medium text-destructive">Danger Zone</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Irreversible actions for this project.
          </p>
        </div>

        <Card>
          <CardContent>
            <FieldSet className="grid grid-cols-6">
              <div className="col-span-4">
                <FieldLegend>Delete project</FieldLegend>
                <FieldDescription>
                  Permanently delete &quot;{projectName}&quot; and all of its
                  tracks, tasks, and labels. This cannot be undone.
                </FieldDescription>
              </div>
              <div className="col-span-2 flex items-center justify-end">
                <AlertDialog open={open} onOpenChange={setOpen}>
                  <AlertDialogTrigger
                    render={
                      <Button variant="destructive" size="sm">
                        Delete project
                      </Button>
                    }
                  />
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete project?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete &quot;{projectName}&quot;
                        and all associated tracks, tasks, and labels. This
                        action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isDeleting}>
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        variant="destructive"
                        disabled={isDeleting}
                        onClick={() => void handleDelete()}
                      >
                        {isDeleting ? <Spinner className="size-4" /> : null}
                        Delete project
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </FieldSet>
          </CardContent>
        </Card>
      </div>
    </Protect>
  )
}
