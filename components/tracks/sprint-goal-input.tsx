'use client'

import { TitleInput } from '@/components/title-input'
import { SPRINT_GOAL_MAX_LENGTH } from '@/lib/track-utils'
import { cn } from '@/lib/utils'

type SprintGoalInputProps = {
  value: string
  onChange?: (value: string) => void
  onSave?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  'aria-label'?: string
}

export function SprintGoalInput({
  value,
  onChange,
  onSave,
  placeholder = 'Sprint goal',
  className,
  disabled,
  'aria-label': ariaLabel,
}: SprintGoalInputProps) {
  function clamp(text: string) {
    return text.slice(0, SPRINT_GOAL_MAX_LENGTH)
  }

  return (
    <TitleInput
      value={value}
      disabled={disabled}
      placeholder={placeholder}
      aria-label={ariaLabel ?? placeholder}
      className={cn(
        'pb-0 pt-0 text-xs! font-medium! leading-snug sm:pb-0',
        className,
      )}
      onChange={(text) => onChange?.(clamp(text))}
      onSave={(text) => onSave?.(clamp(text.trim()))}
    />
  )
}
