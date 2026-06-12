'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type MenuSubmenuSearchProps = {
  value: string
  onValueChange: (value: string) => void
  placeholder: string
  className?: string
}

export function MenuSubmenuSearch({
  value,
  onValueChange,
  placeholder,
  className,
}: MenuSubmenuSearchProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)

  return (
    <div
      className={cn('border-b border-border/50 p-1', className)}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <Input
        ref={inputRef}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        placeholder={placeholder}
        className="h-7 border-0 bg-transparent text-xs shadow-none focus-visible:ring-0"
        onPointerDown={(event) => event.stopPropagation()}
      />
    </div>
  )
}

export function filterByQuery(
  label: string,
  query: string,
  keywords?: string,
): boolean {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return true
  const haystack = `${label} ${keywords ?? ''}`.toLowerCase()
  return haystack.includes(normalized)
}
