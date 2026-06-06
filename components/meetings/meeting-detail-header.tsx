'use client'

import { RiArrowLeftLine, RiDeleteBinLine, RiEditLine } from '@remixicon/react'
import { Button } from '@/components/ui/button'

interface Props {
  title: string
  onBack: () => void
  onEdit: () => void
  onDelete: () => void
}

export function MeetingDetailHeader({ title, onBack, onEdit, onDelete }: Props) {
  return (
    <div className='sticky top-0 z-10 flex h-[var(--header-height)] shrink-0 items-center gap-3 border-b border-border bg-sidebar px-4 backdrop-blur supports-backdrop-filter:bg-sidebar/80'>
      <Button
        variant='ghost'
        size='sm'
        className='gap-1.5 text-muted-foreground'
        onClick={onBack}
      >
        <RiArrowLeftLine className='size-3.5' />
        Meetings
      </Button>
      <span className='text-muted-foreground/40'>/</span>
      <span className='truncate text-sm font-medium'>{title}</span>
      <div className='ml-auto flex items-center gap-2'>
        <Button variant='outline' size='sm' onClick={onEdit}>
          <RiEditLine className='mr-1.5 size-3.5' />
          Edit
        </Button>
        <Button
          variant='outline'
          size='sm'
          className='text-destructive hover:text-destructive'
          onClick={onDelete}
        >
          <RiDeleteBinLine className='mr-1.5 size-3.5' />
          Delete
        </Button>
      </div>
    </div>
  )
}