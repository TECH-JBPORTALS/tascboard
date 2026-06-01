'use client'

import { RiAddFill } from '@remixicon/react'
import { useMutation, useQuery } from 'convex/react'
import * as React from 'react'
import {
  LabelCreateColorStep,
  LabelCreateNewItem,
  LabelDot,
} from '@/components/labels/label-create-popover'
import { Button } from '@/components/ui/button'
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
import { useActor } from '@/hooks/use-actor'
import { DEFAULT_LABEL_COLOR } from '@/lib/label-colors'

type TaskLabelPickerProps = {
  taskId: Id<'tasks'>
  projectId: Id<'projects'>
  projectName: string
  attachedLabels: Doc<'labels'>[]
}

export function TaskLabelPicker({
  taskId,
  projectId,
  projectName,
  attachedLabels,
}: TaskLabelPickerProps) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const [pendingCreateName, setPendingCreateName] = React.useState<
    string | null
  >(null)
  const [createColor, setCreateColor] =
    React.useState<string>(DEFAULT_LABEL_COLOR)
  const { deviceName } = useActor()

  const projectLabels = useQuery(api.label.listByProject, { projectId })
  const createLabel = useMutation(api.label.create)
  const attachLabel = useMutation(api.label.attachToTask)
  const detachLabel = useMutation(api.label.detachFromTask)

  const attachedIds = new Set(attachedLabels.map((l) => l._id))
  const trimmed = query.trim()
  const normalized = trimmed.toLowerCase()

  const filtered =
    projectLabels?.filter((label) =>
      label.name.toLowerCase().includes(normalized),
    ) ?? []

  const exactMatch = projectLabels?.some(
    (label) => label.name.toLowerCase() === normalized,
  )

  async function handleToggle(label: Doc<'labels'>) {
    if (attachedIds.has(label._id)) {
      await detachLabel({ taskId, labelId: label._id, deviceName })
    } else {
      await attachLabel({ taskId, labelId: label._id, deviceName })
    }
  }

  async function handleCreate(name: string, color: string) {
    const labelId = await createLabel({ projectId, name, color })
    await attachLabel({ taskId, labelId, deviceName })
    setQuery('')
    setPendingCreateName(null)
    setCreateColor(DEFAULT_LABEL_COLOR)
    setOpen(false)
  }

  async function handleSelectCreateColor(color: string) {
    if (!pendingCreateName) return
    setCreateColor(color)
    await handleCreate(pendingCreateName, color)
  }

  return (
    <div className="flex space-x-1">
      <div className="flex flex-wrap gap-1.5">
        {attachedLabels.map((label) => (
          <Button
            key={label._id}
            type="button"
            variant="outline"
            size="xs"
            className="rounded-full"
            onClick={() => void handleToggle(label)}
          >
            <LabelDot color={label.color} />
            {label.name}
          </Button>
        ))}
      </div>

      <Popover
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen)
          if (!nextOpen) {
            setPendingCreateName(null)
            setCreateColor(DEFAULT_LABEL_COLOR)
          }
        }}
      >
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size={attachedLabels.length > 0 ? 'icon-xs' : 'xs'}
              className="rounded-full"
            />
          }
        >
          <RiAddFill className="size-3.5" />
          {attachedLabels.length === 0 && 'Add label'}
        </PopoverTrigger>

        <PopoverContent className="w-fit p-0" align="end">
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
                  {filtered.map((label) => (
                    <CommandItem
                      key={label._id}
                      value={label.name}
                      onSelect={() => void handleToggle(label)}
                    >
                      <LabelDot color={label.color} />
                      <span className="flex-1">{label.name}</span>
                      {attachedIds.has(label._id) ? (
                        <span className="text-xs text-muted-foreground">
                          Added
                        </span>
                      ) : null}
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
    </div>
  )
}
