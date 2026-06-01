'use client'

import { RiArrowGoBackLine } from '@remixicon/react'
import { useMutation, useQuery } from 'convex/react'
import * as React from 'react'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { api } from '@/convex/_generated/api'
import type { Doc, Id } from '@/convex/_generated/dataModel'
import { DEFAULT_LABEL_COLOR, LABEL_COLOR_OPTIONS } from '@/lib/label-colors'
import { cn } from '@/lib/utils'

export function LabelDot({
  color,
  className,
}: {
  color: string
  className?: string
}) {
  return (
    <span
      className={cn('size-2 shrink-0 rounded-full', className)}
      style={{ backgroundColor: color }}
    />
  )
}

export function formatLabelColorName(name: string) {
  return name.charAt(0).toUpperCase() + name.slice(1)
}

type LabelCreateColorStepProps = {
  pendingCreateName: string
  createColor: string
  onSelectColor: (color: string) => void
  onBack: () => void
}

export function LabelCreateColorStep({
  pendingCreateName,
  createColor,
  onSelectColor,
  onBack,
}: LabelCreateColorStepProps) {
  return (
    <CommandGroup heading={`Pick a color for "${pendingCreateName}"`}>
      {LABEL_COLOR_OPTIONS.map((color) => (
        <CommandItem
          key={color.id}
          value={`color-${color.id}`}
          onSelect={() => onSelectColor(color.value)}
        >
          <LabelDot color={color.value} className="size-2.5" />
          <span className="flex-1">{formatLabelColorName(color.id)}</span>
          {createColor === color.value ? (
            <span className="text-xs text-muted-foreground">Selected</span>
          ) : null}
        </CommandItem>
      ))}
      <CommandItem
        value="create-back"
        onSelect={onBack}
        className="text-xs text-muted-foreground"
      >
        <RiArrowGoBackLine className="size-2.5" /> Back
      </CommandItem>
    </CommandGroup>
  )
}

type LabelCreateNewItemProps = {
  trimmed: string
  projectName: string
  createColor: string
  onCreateStep: (name: string) => void
}

export function LabelCreateNewItem({
  trimmed,
  projectName,
  createColor,
  onCreateStep,
}: LabelCreateNewItemProps) {
  return (
    <CommandItem
      value={`create-${trimmed}`}
      onSelect={() => onCreateStep(trimmed)}
      className="overflow-hidden bg-muted/50"
    >
      <LabelDot color={createColor} className="size-2.5" />
      <span className="flex-1 text-nowrap text-xs">
        Create new <span className="font-semibold">{projectName}</span> label:{' '}
        <span className="font-semibold text-muted-foreground">
          &quot;{trimmed}&quot;
        </span>
      </span>
    </CommandItem>
  )
}

type LabelCreatePopoverProps = {
  projectId: Id<'projects'>
  projectName: string
  trigger: React.ReactElement
  onCreated?: (labelId: Id<'labels'>) => void
  align?: 'start' | 'center' | 'end'
}

export function LabelCreatePopover({
  projectId,
  projectName,
  trigger,
  onCreated,
  align = 'end',
}: LabelCreatePopoverProps) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const [pendingCreateName, setPendingCreateName] = React.useState<
    string | null
  >(null)
  const [createColor, setCreateColor] =
    React.useState<string>(DEFAULT_LABEL_COLOR)

  const projectLabels = useQuery(api.label.listByProject, { projectId })
  const createLabel = useMutation(api.label.create)

  const trimmed = query.trim()
  const normalized = trimmed.toLowerCase()

  const filtered =
    projectLabels?.filter((label) =>
      label.name.toLowerCase().includes(normalized),
    ) ?? []

  const exactMatch = projectLabels?.some(
    (label) => label.name.toLowerCase() === normalized,
  )

  function resetState() {
    setQuery('')
    setPendingCreateName(null)
    setCreateColor(DEFAULT_LABEL_COLOR)
  }

  async function handleCreate(name: string, color: string) {
    const labelId = await createLabel({ projectId, name, color })
    resetState()
    setOpen(false)
    onCreated?.(labelId)
  }

  async function handleSelectCreateColor(color: string) {
    if (!pendingCreateName) return
    setCreateColor(color)
    await handleCreate(pendingCreateName, color)
  }

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) {
          resetState()
        }
      }}
    >
      <PopoverTrigger render={trigger} />
      <PopoverContent className="w-fit p-0" align={align}>
        <Command shouldFilter={false} className="w-fit min-w-64 max-w-96">
          <CommandInput
            placeholder="Add labels…"
            value={query}
            onValueChange={setQuery}
            className="h-9 border-0"
          />
          <CommandList>
            <CommandEmpty>No labels found</CommandEmpty>
            {pendingCreateName ? (
              <LabelCreateColorStep
                pendingCreateName={pendingCreateName}
                createColor={createColor}
                onSelectColor={(color) => void handleSelectCreateColor(color)}
                onBack={() => setPendingCreateName(null)}
              />
            ) : (
              <CommandGroup>
                {filtered.map((label: Doc<'labels'>) => (
                  <CommandItem key={label._id} value={label.name} disabled>
                    <LabelDot color={label.color} />
                    <span className="flex-1">{label.name}</span>
                  </CommandItem>
                ))}
                {trimmed && !exactMatch ? (
                  <LabelCreateNewItem
                    trimmed={trimmed}
                    projectName={projectName}
                    createColor={createColor}
                    onCreateStep={setPendingCreateName}
                  />
                ) : null}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
