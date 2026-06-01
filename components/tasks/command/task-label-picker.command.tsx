'use client'

import { useMutation, useQuery } from 'convex/react'
import * as React from 'react'
import {
  LabelCreateColorStep,
  LabelCreateNewItem,
  LabelDot,
} from '@/components/labels/label-create-popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { api } from '@/convex/_generated/api'
import type { Doc, Id } from '@/convex/_generated/dataModel'
import { useActor } from '@/hooks/use-actor'
import { DEFAULT_LABEL_COLOR } from '@/lib/label-colors'
import { useOptionalTaskActionsContext } from '../task-actions-provider'

type TaskLabelPickerCommandProps = {
  projectId: Id<'projects'>
  projectName?: string
  taskId?: Id<'tasks'>
  attachedLabelIds?: Set<Id<'labels'>>
  onToggle?: (labelId: Id<'labels'>) => void
  allowCreate?: boolean
  placeholder?: string
}

export function TaskLabelPickerCommand({
  projectId,
  projectName = 'project',
  taskId: taskIdProp,
  attachedLabelIds: attachedLabelIdsProp,
  onToggle: onToggleProp,
  allowCreate = true,
  placeholder = 'Add labels…',
}: TaskLabelPickerCommandProps) {
  const context = useOptionalTaskActionsContext()
  const { deviceName } = useActor()
  const [query, setQuery] = React.useState('')
  const [pendingCreateName, setPendingCreateName] = React.useState<
    string | null
  >(null)
  const [createColor, setCreateColor] =
    React.useState<string>(DEFAULT_LABEL_COLOR)

  const projectLabelsFromQuery = useQuery(api.label.listByProject, { projectId })
  const createLabel = useMutation(api.label.create)
  const attachLabel = useMutation(api.label.attachToTask)
  const detachLabel = useMutation(api.label.detachFromTask)

  const taskId = taskIdProp ?? context?.task._id
  const projectLabels = context?.projectLabels ?? projectLabelsFromQuery ?? []
  const attachedLabelIds =
    attachedLabelIdsProp ??
    context?.attachedLabelIds ??
    new Set<Id<'labels'>>()

  const trimmed = query.trim()
  const normalized = trimmed.toLowerCase()

  const filtered = projectLabels.filter((label) =>
    label.name.toLowerCase().includes(normalized),
  )

  const exactMatch = projectLabels.some(
    (label) => label.name.toLowerCase() === normalized,
  )

  async function handleToggle(label: Doc<'labels'>) {
    if (onToggleProp) {
      await onToggleProp(label._id)
      return
    }
    if (context) {
      await context.toggleLabel(label._id)
      return
    }
    if (!taskId) return
    if (attachedLabelIds.has(label._id)) {
      await detachLabel({ taskId, labelId: label._id, deviceName })
    } else {
      await attachLabel({ taskId, labelId: label._id, deviceName })
    }
  }

  async function handleCreate(name: string, color: string) {
    if (!taskId) return
    const labelId = await createLabel({ projectId, name, color })
    await attachLabel({ taskId, labelId, deviceName })
    setQuery('')
    setPendingCreateName(null)
    setCreateColor(DEFAULT_LABEL_COLOR)
  }

  async function handleSelectCreateColor(color: string) {
    if (!pendingCreateName) return
    setCreateColor(color)
    await handleCreate(pendingCreateName, color)
  }

  return (
    <Command shouldFilter={false} className="w-fit min-w-64 max-w-96">
      <CommandInput
        placeholder={placeholder}
        value={query}
        onValueChange={setQuery}
        className="h-9 border-0"
      />
      <CommandList>
        <CommandEmpty>No labels found</CommandEmpty>
        {allowCreate && pendingCreateName ? (
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
                {attachedLabelIds.has(label._id) ? (
                  <span className="text-xs text-muted-foreground">Added</span>
                ) : null}
              </CommandItem>
            ))}
            {allowCreate && trimmed && !exactMatch ? (
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
  )
}
