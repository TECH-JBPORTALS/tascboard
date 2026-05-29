'use client'

import { GlobalTiptapEditor } from './global-tiptap-editor'

type RichTextEditorProps = {
  value?: string
  onChange?: (markdown: string) => void
  onSave?: (markdown: string) => void
  placeholder?: string
  className?: string
  editorClassName?: string
  disabled?: boolean
  mode?: 'rich' | 'title'
  editorAriaLabel?: string
}

export function RichTextEditor({
  value,
  onChange,
  onSave,
  placeholder = 'Add description...',
  className,
  editorClassName,
  disabled,
  mode = 'rich',
  editorAriaLabel,
}: RichTextEditorProps) {
  return (
    <GlobalTiptapEditor
      mode={mode}
      contentType="markdown"
      value={value ?? ''}
      placeholder={placeholder}
      className={className ?? 'pb-7'}
      editorClassName={editorClassName}
      disabled={disabled}
      editorAriaLabel={editorAriaLabel}
      onChange={(nextValue) => {
        onChange?.(typeof nextValue === 'string' ? nextValue : '')
      }}
      onSave={(nextValue) => {
        onSave?.(typeof nextValue === 'string' ? nextValue : '')
      }}
    />
  )
}
