'use client'

import { RiFileTextLine } from '@remixicon/react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface Props {
  notes: string
  onChange: (val: string) => void
  onSave: () => void
  saving: boolean
  hasSchedule: boolean
}

export function MeetingDetailNotes({
  notes,
  onChange,
  onSave,
  saving,
  hasSchedule,
}: Props) {
  return (
    <div className='space-y-3'>
      <div className='flex items-center gap-2'>
        <RiFileTextLine className='size-4 text-muted-foreground' />
        <h2 className='text-sm font-semibold'>Meeting Notes</h2>
      </div>
      <Textarea
        placeholder='Write meeting notes, action items, decisions made...'
        value={notes}
        onChange={(e) => onChange(e.target.value)}
        className='min-h-[200px] resize-none'
      />
      <div className='flex items-center justify-between'>
        {!hasSchedule && (
          <p className='text-xs text-muted-foreground'>
            Notes can be saved once the meeting has been scheduled/run.
          </p>
        )}
        <div className='ml-auto'>
          <Button size='sm' onClick={onSave} disabled={saving || !hasSchedule}>
            {saving ? 'Saving...' : 'Save Notes'}
          </Button>
        </div>
      </div>
    </div>
  )
}