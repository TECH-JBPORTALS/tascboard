'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { GlobalTiptapEditor } from './editor/GlobalTiptapEditor'

type TaskTitleInputProps = {
  onChange?: (value: string) => void
  value?: string
  onSave?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  blurOnSave?: boolean
  'aria-label'?: string
}

export function TitleInput({
  value,
  onChange,
  onSave,
  placeholder = 'Enter title',
  className,
  disabled,
  blurOnSave = true,
  'aria-label': ariaLabel,
}: TaskTitleInputProps) {
  const latestTextRef = React.useRef(value ?? '')
  const skipNextBlurSaveRef = React.useRef(false)

  React.useEffect(() => {
    latestTextRef.current = value ?? ''
  }, [value])

  return (
    <GlobalTiptapEditor
      mode="title"
      value={value ?? ''}
      placeholder={placeholder}
      disabled={disabled}
      singleLine
      blurOnEnter
      editorAriaLabel={ariaLabel ?? placeholder}
      className="h-fit overflow-y-hidden"
      editorClassName={cn(
        'h-fit pb-5 pt-0 text-xl leading-tight sm:text-2xl',
        className,
      )}
      onChange={(nextValue) => {
        const text = typeof nextValue === 'string' ? nextValue : ''
        latestTextRef.current = text
        onChange?.(text)
      }}
      onSave={(nextValue) => {
        if (!blurOnSave) return
        if (skipNextBlurSaveRef.current) {
          skipNextBlurSaveRef.current = false
          return
        }
        const text = typeof nextValue === 'string' ? nextValue : ''
        latestTextRef.current = text
        onSave?.(text)
      }}
      onEnter={(nextValue) => {
        skipNextBlurSaveRef.current = true
        const text = typeof nextValue === 'string' ? nextValue : ''
        latestTextRef.current = text
        onSave?.(text)
      }}
    />
  )
}
