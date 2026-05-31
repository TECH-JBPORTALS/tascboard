'use client'

import { RiAddLine, RiDeleteBinLine, RiSearch2Line } from '@remixicon/react'
import { useMutation, useQuery } from 'convex/react'
import { useParams } from 'next/navigation'
import React, { useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  LabelCreatePopover,
  LabelDot,
} from '@/components/labels/label-create-popover'
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
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/convex/_generated/api'
import type { Doc, Id } from '@/convex/_generated/dataModel'
import { Card, CardContent } from '../ui/card'
import { InputGroup, InputGroupAddon, InputGroupInput } from '../ui/input-group'
import { Separator } from '../ui/separator'
import { Spinner } from '../ui/spinner'

function DeleteLabelDialog({
  label,
  open,
  onOpenChange,
}: {
  label: Doc<'labels'> | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const removeLabel = useMutation(api.label.remove)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    if (!label) return

    setIsDeleting(true)
    try {
      await removeLabel({ labelId: label._id })
      toast.success('Label deleted')
      onOpenChange(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete label',
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete label?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete &quot;{label?.name}&quot; and remove it
            from all tasks. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isDeleting}
            onClick={() => void handleDelete()}
          >
            {isDeleting ? <Spinner className="size-4" /> : null}
            Delete label
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function ProjectLabelsSettingsPage() {
  const { projectId } = useParams<{ projectId: Id<'projects'> }>()
  const project = useQuery(api.project.get, { projectId })
  const labels = useQuery(api.label.listByProject, { projectId })
  const [search, setSearch] = useState('')
  const [labelToDelete, setLabelToDelete] = useState<Doc<'labels'> | null>(null)

  const normalized = search.trim().toLowerCase()

  const filteredLabels = useMemo(
    () =>
      labels?.filter((label) =>
        label.name.toLowerCase().includes(normalized),
      ) ?? [],
    [labels, normalized],
  )

  if (project === undefined || labels === undefined) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <Skeleton className="h-7 w-24" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-full" />
        <Card>
          <CardContent className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
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
    <div className="flex flex-col gap-6 relative">
      <div>
        <h1 className="text-xl font-semibold">Labels</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Labels used across tasks in this project.
        </p>
      </div>

      <div className="flex justify-between items-center gap-3">
        <InputGroup className="w-1/2">
          <InputGroupAddon>
            <RiSearch2Line />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Search labels…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </InputGroup>
        <LabelCreatePopover
          projectId={projectId}
          projectName={project.name ?? ''}
          trigger={
            <Button type="button" size="sm">
              <RiAddLine className="size-4" />
              Add label
            </Button>
          }
          onCreated={() => toast.success('Label created')}
        />
      </div>

      <Card className="py-0 gap-0">
        {filteredLabels.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">
            {labels.length === 0
              ? 'No labels yet. Add one to get started.'
              : 'No labels match your search.'}
          </p>
        ) : (
          <>
            {filteredLabels.map((label, index) => (
              <React.Fragment key={label._id}>
                {index > 0 ? <Separator /> : null}
                <CardContent className="flex items-center py-4 gap-2.5 hover:bg-accent/40">
                  <LabelDot color={label.color} className="size-2.5" />
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {label.name}
                  </span>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    aria-label={`Delete ${label.name}`}
                    onClick={() => setLabelToDelete(label)}
                  >
                    <RiDeleteBinLine />
                  </Button>
                </CardContent>
              </React.Fragment>
            ))}
          </>
        )}
      </Card>

      <DeleteLabelDialog
        label={labelToDelete}
        open={labelToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setLabelToDelete(null)
        }}
      />
    </div>
  )
}
