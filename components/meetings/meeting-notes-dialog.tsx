'use client'

import { useMutation, } from 'convex/react'
import * as React from 'react'
import { toast } from 'sonner'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { Button } from '../ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'

interface MeetingNotesDialogProps {
  scheduleMeetingId: string | null
  onClose: () => void
}

export function MeetingNotesDialog({
  scheduleMeetingId,
  onClose,
}: MeetingNotesDialogProps) {

  const recordNotes = useMutation(api.meeting.recordMeetingNotes)
  const [notes, setNotes] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (!scheduleMeetingId) setNotes('')
  }, [scheduleMeetingId])

  const handleSave = async () => {
    if (!scheduleMeetingId) return
    setLoading(true)
    try {
      await recordNotes({
        scheduleMeetingId: scheduleMeetingId as Id<'scheduleMeeting'>,
        finalNotes: notes,
      })
      toast.success('Notes saved')
      onClose()
    } catch {
      toast.error('Failed to save notes')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={!!scheduleMeetingId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>Meeting Notes</DialogTitle>
        </DialogHeader>
        <div className='flex flex-col gap-2 py-1'>
          <Label className='text-xs text-muted-foreground'>
            Record notes from this meeting session
          </Label>
          <Textarea
            placeholder='Write meeting notes, action items, decisions made...'
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className='min-h-[160px] resize-none'
          />
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Notes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}