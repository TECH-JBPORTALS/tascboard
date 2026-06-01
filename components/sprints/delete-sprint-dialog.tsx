'use client'

import * as React from 'react'
import { useSprintActionsContext } from '@/components/sprints/sprint-actions-provider'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Spinner } from '@/components/ui/spinner'
import { formatSprintLabel } from '@/lib/track-utils'

export function DeleteSprintDialog() {
  const { sprint, deleteDialogOpen, setDeleteDialogOpen, deleteSprint } =
    useSprintActionsContext()
  const [isDeleting, setIsDeleting] = React.useState(false)

  async function handleDelete() {
    setIsDeleting(true)
    try {
      await deleteSprint()
      setDeleteDialogOpen(false)
    } catch {
      // toast handled in deleteSprint
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete sprint?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete{' '}
            {formatSprintLabel(sprint.sprintNumber)}
            {sprint.goal ? ` "${sprint.goal}"` : ''}. Tasks in this sprint will
            remain but will no longer be assigned to it. This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isDeleting}
            onClick={(event) => {
              event.preventDefault()
              void handleDelete()
            }}
          >
            {isDeleting ? <Spinner /> : null}
            Delete sprint
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
