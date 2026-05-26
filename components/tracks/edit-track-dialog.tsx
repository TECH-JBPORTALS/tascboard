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
import type { Doc } from '@/convex/_generated/dataModel'

type EditTrackDialogProps = {
  track: Doc<'tracks'> | null
  onOpenChange: (open: boolean) => void
}

export function EditTrackDialog({ track, onOpenChange }: EditTrackDialogProps) {
  const updateTrack = useMutation(api.track.update)
  const [name, setName] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [status, setStatus] = React.useState<Doc<'tracks'>['status']>('active')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (track) {
      setName(track.name)
      setDescription(track.description ?? '')
      setStatus(track.status)
      setError(null)
    }
  }, [track])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!track) return

    const trimmed = name.trim()
    if (!trimmed) {
      setError('Track name is required')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await updateTrack({
        trackId: track._id,
        body: {
          name: trimmed,
          description: description.trim(),
          status,
        },
      })
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update track')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={track !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit track</DialogTitle>
            <DialogDescription>Update track details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-track-name">Name</Label>
              <Input
                id="edit-track-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-track-description">Description</Label>
              <Textarea
                id="edit-track-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(value) =>
                  setStatus(value as Doc<'tracks'>['status'])
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
              {isSubmitting ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
