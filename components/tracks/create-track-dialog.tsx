'use client'

import { useMutation } from 'convex/react'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { nextTrackCode } from '@/lib/track-utils'

type CreateTrackDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: Id<'projects'>
  existingTrackCodes: string[]
  defaultLeaderId: string
}

export function CreateTrackDialog({
  open,
  onOpenChange,
  projectId,
  existingTrackCodes,
  defaultLeaderId,
}: CreateTrackDialogProps) {
  const createTrack = useMutation(api.track.create)
  const [name, setName] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [status, setStatus] = React.useState<
    'active' | 'completed' | 'archived'
  >('active')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open) {
      setName('')
      setDescription('')
      setStatus('active')
      setError(null)
    }
  }, [open])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Track name is required')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await createTrack({
        name: trimmed,
        description: description.trim() || undefined,
        projectId,
        trackCode: nextTrackCode(existingTrackCodes),
        trackLeaderID: defaultLeaderId,
        status,
      })
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create track')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create track</DialogTitle>
            <DialogDescription>
              Tracks group work into focused streams inside a project.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="track-name">Name</Label>
              <Input
                id="track-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Frontend Track"
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="track-description">Description</Label>
              <Textarea
                id="track-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(value) =>
                  setStatus(value as 'active' | 'completed' | 'archived')
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating…' : 'Create track'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
